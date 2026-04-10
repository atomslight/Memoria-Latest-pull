import { prisma } from '../config/database';

export interface MembershipResult {
  isMember: boolean;
  role: 'admin' | 'member' | null;
  isCreator: boolean;
}

/**
 * Check if a user is a member of a circle and return their role.
 * Also checks if the user is the circle creator.
 */
export async function checkMembership(
  circleId: string,
  userId: string
): Promise<MembershipResult> {
  const [membership, circle] = await Promise.all([
    prisma.circleMember.findUnique({
      where: { circleId_userId: { circleId, userId } },
      select: { role: true },
    }),
    prisma.circle.findUnique({
      where: { id: circleId },
      select: { createdBy: true },
    }),
  ]);

  if (!membership) {
    return { isMember: false, role: null, isCreator: false };
  }

  return {
    isMember: true,
    role: membership.role as 'admin' | 'member',
    isCreator: circle?.createdBy === userId,
  };
}
