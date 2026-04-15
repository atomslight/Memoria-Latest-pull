import { prisma } from '../config/database';
import { aiInferenceClient } from './aiInferenceClient';

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
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

export class FaceMatchingService {
  /**
   * Match new face embeddings against existing face groups.
   * - If match found → assign to existing group
   * - If no match → create new group
   */
  async matchAndGroupFaces(
    userId: string,
    photoId: string,
    cropEmbeddings: number[][],
    faceIds: string[]
  ): Promise<{ results: MatchResult[]; groupsCreated: number }> {
    // 1. Fetch all existing FaceGroups for this user
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

    const results: MatchResult[] = [];
    const groupsToCreate: { embedding: number[]; faceId: string }[] = [];
    const groupsToUpdate: { groupId: string; faceId: string }[] = [];

    // 2. Match each embedding against existing groups
    for (let i = 0; i < cropEmbeddings.length; i++) {
      const embedding = cropEmbeddings[i];
      const faceId = faceIds[i];

      let bestMatch: { groupId: string; score: number } | null = null;

      for (const group of existingGroups) {
        const distance = euclideanDistance(embedding, group.bestEmbedding);
        if (distance < EUCLIDEAN_THRESHOLD) {
          if (!bestMatch || distance < bestMatch.score) {
            bestMatch = { groupId: group.id, score: distance };
          }
        }
      }

      if (bestMatch) {
        // Assign to existing group
        results.push({ cropIndex: i, matched: true, groupId: bestMatch.groupId, score: bestMatch.score });
        groupsToUpdate.push({ groupId: bestMatch.groupId, faceId });
      } else {
        // Will create new group
        results.push({ cropIndex: i, matched: false });
        groupsToCreate.push({ embedding, faceId });
      }
    }

    // 3. Create new groups for unmatched faces
    let groupsCreated = 0;
    for (const item of groupsToCreate) {
      const group = await prisma.faceGroup.create({
        data: {
          userId,
          name: `Person ${Date.now()}`,
          bestEmbedding: toVectorString(item.embedding),
          coverFaceId: item.faceId,
        },
      });
      groupsCreated++;

      // Update face with groupId
      await prisma.face.update({
        where: { id: item.faceId },
        data: { groupId: group.id },
      });
    }

    // 4. Update matched faces with their groupId
    for (const item of groupsToUpdate) {
      await prisma.face.update({
        where: { id: item.faceId },
        data: { groupId: item.groupId },
      });
    }

    console.log(`[FaceMatching] photoId=${photoId}, matched=${results.filter(r => r.matched).length}, newGroups=${groupsCreated}`);

    return { results, groupsCreated };
  }
}

export const faceMatchingService = new FaceMatchingService();