import { prisma } from '../config/database';

// Parse Postgres vector string to number array
function parseVectorString(raw: string): number[] {
  return raw
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(Number);
}

// Convert number array to Postgres vector string
function toVectorString(arr: number[]): string {
  return `[${arr.join(',')}]`;
}

interface GroupEmbeddingRecord {
  id: string;
  bestEmbedding: number[];
  name: string;
}

interface MatchResult {
  cropIndex: number;
  matched: boolean;
  groupId?: string;
  score?: number;
}

const EUCLIDEAN_THRESHOLD = 0.6;

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
}

export class FaceMatchingService {
  async matchAndGroupFaces(
    userId: string,
    photoId: string,
    cropEmbeddings: number[][],
    faceIds: string[]
  ): Promise<{ results: MatchResult[]; groupsCreated: number }> {
    const groupRows = await prisma.$queryRaw<
      { id: string; best_embedding: string | null; name: string }[]
    >`
      SELECT id, best_embedding::text, name
      FROM face_groups
      WHERE user_id = ${userId}
    `;

    const existingGroups: GroupEmbeddingRecord[] = groupRows
      .filter(row => row.best_embedding)
      .map(row => ({
        id: row.id,
        bestEmbedding: parseVectorString(row.best_embedding!),
        name: row.name,
      }));

    let unknownGroupRow = await prisma.$queryRaw<
      { id: string }[]
    >`SELECT id FROM face_groups WHERE user_id = ${userId} AND name = 'Unknown' LIMIT 1`;
    let unknownGroupId: string;

    if (unknownGroupRow.length > 0) {
      unknownGroupId = unknownGroupRow[0]!.id;
    } else {
      const newUnknown = await prisma.face_groups.create({
        data: {
          user_id: userId,
          name: 'Unknown',
        }
      });
      unknownGroupId = newUnknown.id;
    }

    const results: MatchResult[] = [];
    const groupsToCreate: { embedding: number[]; faceId: string }[] = [];
    const groupsToUpdate: { groupId: string; faceId: string }[] = [];

    for (let i = 0; i < cropEmbeddings.length; i++) {
      const embedding = cropEmbeddings[i]!;
      const faceId = faceIds[i]!;

      let bestMatch: { groupId: string; score: number } | null = null;

      for (const group of existingGroups) {
        if (!group.bestEmbedding) continue;
        const distance = euclideanDistance(embedding, group.bestEmbedding);
        if (distance < EUCLIDEAN_THRESHOLD) {
          if (!bestMatch || distance < bestMatch.score) {
            bestMatch = { groupId: group.id, score: distance };
          }
        }
      }

      if (bestMatch) {
        results.push({ cropIndex: i, matched: true, groupId: bestMatch.groupId, score: bestMatch.score });
        groupsToUpdate.push({ groupId: bestMatch.groupId, faceId });
      } else {
        results.push({ cropIndex: i, matched: false });
        groupsToCreate.push({ embedding, faceId });
      }
    }

    let groupsCreated = 0;
    for (const item of groupsToCreate) {
      groupsToUpdate.push({ groupId: unknownGroupId, faceId: item.faceId });

      await prisma.$executeRawUnsafe(`
        UPDATE face_groups SET best_embedding = '[${item.embedding.join(',')}]'::vector, cover_face_id = '${item.faceId}'
        WHERE id = '${unknownGroupId}' AND best_embedding IS NULL
      `);
    }

    for (const item of groupsToUpdate) {
      await prisma.face.update({
        where: { id: item.faceId },
        data: { group_id: item.groupId },
      });
    }

    console.log(`[FaceMatching] photoId=${photoId}, matched=${results.filter(r => r.matched).length}, newGroups=${groupsCreated}`);

    return { results, groupsCreated };
  }

  async matchNewFaces(userId: string, embeddings: number[][], photoId: string) {
    const faces = await prisma.face.findMany({ where: { photoId: photoId }});
    const faceIds = faces.map(f => f.id);
    if (embeddings.length === faceIds.length) {
      await this.matchAndGroupFaces(userId, photoId, embeddings, faceIds);
    }
  }
}

export const faceMatchingService = new FaceMatchingService();
