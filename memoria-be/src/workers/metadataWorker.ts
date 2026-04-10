import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { MetadataJobData } from '../queues/metadata';
import { prisma } from '../config/database';
import { redis } from '../config/redis'; // your ioredis instance

// Cache geocoding results for 90 days — most coords repeat (same city)
const GEO_CACHE_TTL = 60 * 60 * 24 * 90;

function buildCacheKey(lat: number, lng: number): string {
  // Round to 4 decimal places (~11m accuracy) to maximise cache hits
  const rLat = lat.toFixed(4);
  const rLng = lng.toFixed(4);
  return `geo:${rLat}:${rLng}`;
}

async function tryBigDataCloud(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;

    const data = await res.json();
    const location =
      data.city ||
      data.locality ||
      data.principalSubdivision;
    const country = data.countryName;

    if (location && country) return `${location}, ${country}`;
    if (location) return location;
    return null;
  } catch {
    return null;
  }
}

async function tryPhoton(lat: number, lng: number): Promise<string | null> {
  try {
    // Swap to your self-hosted URL if you have one: http://your-photon-host/reverse
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MemoriaApp/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const props = data?.features?.[0]?.properties;
    if (!props) return null;

    const location = props.city || props.town || props.village || props.county;
    const country = props.country;

    if (location && country) return `${location}, ${country}`;
    if (location) return location;
    return null;
  } catch {
    return null;
  }
}

/**
 * Reverse geocode with Redis cache + BigDataCloud primary + Photon fallback.
 * Cache hits short-circuit everything — critical for 500-1000+ concurrent users.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const cacheKey = buildCacheKey(lat, lng);

  // 1. Redis cache check
  const cached = await redis.get(cacheKey);
  if (cached !== null) {
    return cached === '__null__' ? null : cached;
  }

  // 2. BigDataCloud (primary, 50k/month free, no API key)
  let result = await tryBigDataCloud(lat, lng);

  // 3. Photon/OSM (fallback — public or self-hosted)
  if (!result) {
    result = await tryPhoton(lat, lng);
  }

  // 4. Cache the result (even nulls, to avoid hammering APIs on bad coords)
  await redis.set(cacheKey, result ?? '__null__', 'EX', GEO_CACHE_TTL);

  return result;
}

export const metadataWorker = new Worker<MetadataJobData>(
  'metadata',
  async (job) => {
    const { photoId, userId, storagePath: _filePath } = job.data;
    console.log(`Processing metadata for photo ${photoId} (user: ${userId})`);

    const photo = await prisma.aIResult.findUnique({ where: { id: photoId } });
    let newLocationName: string | null = null;

    if (photo?.latitude && photo?.longitude && !photo.locationName) {
      console.log(`Geocoding ${photo.latitude}, ${photo.longitude}`);
      newLocationName = await reverseGeocode(photo.latitude, photo.longitude);

      if (newLocationName) {
        await prisma.photo.update({
          where: { id: photoId },
          data: { locationName: newLocationName },
        });
        console.log(`✅ ${photoId} → ${newLocationName}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      photoId,
      metadata: {
        capturedAt: new Date().toISOString(),
        camera: 'Placeholder Camera',
        location: newLocationName,
        dimensions: { width: 1920, height: 1080 },
      },
    };
  },
  {
    connection: getRedisConnection(),
    concurrency: 15,
    limiter: { max: 30, duration: 1000 },
  }
);
// Event listeners
metadataWorker.on('completed', (job) => {
  console.log(`✅ Metadata job ${job.id} completed`);
});

metadataWorker.on('failed', (job, err) => {
  console.error(`❌ Metadata job ${job?.id} failed:`, err.message);
});

metadataWorker.on('error', (err) => {
  console.error('❌ Metadata worker error:', err);
});