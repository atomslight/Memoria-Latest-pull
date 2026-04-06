import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';

function objectKey(logicalBucket: string, relPath: string): string {
  const safe = relPath.replace(/^[/\\]+/, '');
  return `${logicalBucket}/${safe}`;
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const stream = body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function isNotFoundError(e: unknown): boolean {
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404;
}

function cdnUrlForKey(key: string): string {
  const base = env.CDN_URL!.replace(/\/$/, '');
  const path = key.split('/').map(encodeURIComponent).join('/');
  return `${base}/${path}`;
}

/**
 * AWS S3: `memories` → private bucket; `avatars` → public bucket (optional CDN URLs).
 */
class S3StorageService {
  private readonly client: S3Client;
  private readonly defaultPresignSeconds: number;

  constructor() {
    this.defaultPresignSeconds = env.S3_PRESIGN_DEFAULT_SECONDS;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials:
        env.accessKeyId && env.secretAccessKey
          ? {
              accessKeyId: env.accessKeyId,
              secretAccessKey: env.secretAccessKey,
            }
          : undefined,
    });
  }

  /** S3 bucket name for logical prefix (memories = private, avatars = public). */
  private physicalBucket(logical: string): string {
    if (logical === 'memories') return env.S3_PRIVATE_BUCKET_NAME;
    if (logical === 'avatars') return env.S3_PUBLIC_BUCKET;
    return env.S3_PUBLIC_BUCKET;
  }

  async uploadFile(
    logicalBucket: string,
    relPath: string,
    file: Buffer,
    contentType: string,
    options?: { upsert?: boolean }
  ): Promise<{ path: string }> {
    const bucket = this.physicalBucket(logicalBucket);
    const key = objectKey(logicalBucket, relPath);
    if (!options?.upsert) {
      try {
        await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error('File already exists');
      } catch (e) {
        if (e instanceof Error && e.message === 'File already exists') throw e;
        if (!isNotFoundError(e)) throw e;
      }
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      })
    );
    return { path: relPath };
  }

  async downloadFile(logicalBucket: string, relPath: string): Promise<Buffer> {
    const bucket = this.physicalBucket(logicalBucket);
    const key = objectKey(logicalBucket, relPath);
    const out = await this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    return streamToBuffer(out.Body);
  }

  /**
   * URL after upload: CDN for public avatars when configured; else presigned.
   * Memories always use presigned URLs (private bucket).
   */
  async getPublicUrl(logicalBucket: string, relPath: string): Promise<string> {
    const key = objectKey(logicalBucket, relPath);
    if (logicalBucket === 'avatars' && env.CDN_URL) {
      return cdnUrlForKey(key);
    }
    return this.getSignedUrl(logicalBucket, relPath, this.defaultPresignSeconds);
  }

  async getSignedUrl(
    logicalBucket: string,
    relPath: string,
    expiresInSeconds: number
  ): Promise<string> {
    const bucket = this.physicalBucket(logicalBucket);
    const key = objectKey(logicalBucket, relPath);
    if (logicalBucket === 'avatars' && env.CDN_URL) {
      return cdnUrlForKey(key);
    }
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.client, cmd, { expiresIn: expiresInSeconds });
  }

  async deleteFile(logicalBucket: string, relPath: string): Promise<void> {
    const bucket = this.physicalBucket(logicalBucket);
    const key = objectKey(logicalBucket, relPath);
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } catch (e) {
      if (isNotFoundError(e)) return;
      throw e;
    }
  }

  async deleteFiles(logicalBucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const bucket = this.physicalBucket(logicalBucket);
    const keys = paths.map((p) => objectKey(logicalBucket, p));
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }

  async listFiles(logicalBucket: string, prefix: string = ''): Promise<{ name: string }[]> {
    const bucket = this.physicalBucket(logicalBucket);
    const safe = prefix.replace(/^[/\\]+/, '');
    const p = safe ? `${logicalBucket}/${safe}/` : `${logicalBucket}/`;
    const out = await this.client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: p,
        MaxKeys: 1000,
      })
    );
    return (out.Contents ?? []).map((o) => ({ name: o.Key ?? '' }));
  }

  /** Health check: both buckets reachable when credentials allow */
  async ping(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: env.S3_PUBLIC_BUCKET }));
      await this.client.send(new HeadBucketCommand({ Bucket: env.S3_PRIVATE_BUCKET_NAME }));
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new S3StorageService();
