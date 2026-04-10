import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { storageService } from '../../services/storage';
import { checkMembership } from '../../helpers/circleAuth';
import { resolveProfilePicUrl } from '../../helpers/mediaUrl';
import {
  CreateCircleSchema,
  AddMemberSchema,
  AddCirclePhotoSchema,
  UpdateMemberRoleSchema,
} from '../../validators';

// ─── Create Circle ────────────────────────────────────────────────────────────

export const createCircle = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateCircleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.errors });
    return;
  }

  const userId = req.user!.id;
  const { name, description, emoji } = parsed.data;

  const circle = await prisma.circle.create({
    data: {
      name,
      description: description ?? null,
      emoji: emoji ?? '🔵',
      createdBy: userId,
      members: {
        create: { userId, role: 'admin' },
      },
    },
  });

  // Return with metadata
  res.status(201).json({
    circle: {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      emoji: circle.emoji,
      createdBy: circle.createdBy,
      createdAt: circle.createdAt,
      updatedAt: circle.updatedAt,
      photoCount: 0,
      memberCount: 1,
      lastActivity: circle.createdAt,
      isAdmin: true,
    },
  });
};

// ─── List User's Circles ──────────────────────────────────────────────────────

export const listCircles = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const memberships = await prisma.circleMember.findMany({
    where: { userId },
    include: {
      circle: {
        include: {
          _count: { select: { members: true, photos: true } },
        },
      },
    },
  });

  // Get last activity for each circle
  const circlesWithMetadata = await Promise.all(
    memberships.map(async (m) => {
      const lastPhoto = await prisma.circlePhoto.findFirst({
        where: { circleId: m.circle.id },
        orderBy: { uploadedAt: 'desc' },
        select: { uploadedAt: true },
      });

      return {
        id: m.circle.id,
        name: m.circle.name,
        description: m.circle.description,
        emoji: m.circle.emoji,
        createdBy: m.circle.createdBy,
        createdAt: m.circle.createdAt,
        updatedAt: m.circle.updatedAt,
        memberCount: m.circle._count.members,
        photoCount: m.circle._count.photos,
        lastActivity: lastPhoto?.uploadedAt || m.circle.createdAt,
        isAdmin: m.role === 'admin',
      };
    })
  );

  // Sort by lastActivity DESC (most recent first)
  circlesWithMetadata.sort((a, b) =>
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );

  res.json({ circles: circlesWithMetadata });
};

// ─── Get Circle Detail ────────────────────────────────────────────────────────

export const getCircleDetail = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }

  const [circle, photoCount, lastPhoto] = await Promise.all([
    prisma.circle.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicUrl: true
              }
            }
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, photos: true } },
      },
    }),
    prisma.circlePhoto.count({ where: { circleId: id } }),
    prisma.circlePhoto.findFirst({
      where: { circleId: id },
      orderBy: { uploadedAt: 'desc' },
      select: { uploadedAt: true },
    }),
  ]);

  if (!circle) {
    res.status(404).json({ error: 'Not found', message: 'Circle not found' });
    return;
  }

  const members = await Promise.all(
    circle.members.map(async (m) => ({
      id: m.id,
      userId: m.userId,
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        profilePicUrl: await resolveProfilePicUrl(m.user.profilePicUrl),
      },
      role: m.role,
      isCreator: m.userId === circle.createdBy,
      joinedAt: m.joinedAt,
    }))
  );

  res.json({
    circle: {
      id: circle.id,
      name: circle.name,
      description: circle.description,
      emoji: circle.emoji,
      createdBy: circle.createdBy,
      createdAt: circle.createdAt,
      updatedAt: circle.updatedAt,
      photoCount,
      memberCount: circle._count.members,
      lastActivity: lastPhoto?.uploadedAt || circle.createdAt,
      isAdmin: membership.role === 'admin',
      members,
    },
  });
};

// ─── Update Circle ────────────────────────────────────────────────────────────

export const updateCircle = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }
  if (membership.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Only admins can update this circle' });
    return;
  }

  const { name, description, emoji } = req.body;
  const updateData: { name?: string; description?: string | null; emoji?: string } = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (emoji !== undefined) updateData.emoji = emoji;

  const [updated, photoCount, memberCount, lastPhoto] = await Promise.all([
    prisma.circle.update({
      where: { id },
      data: updateData,
    }),
    prisma.circlePhoto.count({ where: { circleId: id } }),
    prisma.circleMember.count({ where: { circleId: id } }),
    prisma.circlePhoto.findFirst({
      where: { circleId: id },
      orderBy: { uploadedAt: 'desc' },
      select: { uploadedAt: true },
    }),
  ]);

  res.json({
    circle: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      emoji: updated.emoji,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      photoCount,
      memberCount,
      lastActivity: lastPhoto?.uploadedAt || updated.createdAt,
      isAdmin: true,
    },
  });
};

// ─── Bulk Add Photos to Circle ────────────────────────────────────────────────

export const bulkAddPhotos = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }

  const { photoIds } = req.body;
  if (!Array.isArray(photoIds) || photoIds.length === 0) {
    res.status(400).json({ error: 'photoIds must be a non-empty array' });
    return;
  }

  // Verify all photos belong to the requesting user
  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds }, userId, deletedAt: null },
    select: { id: true },
  });

  if (photos.length !== photoIds.length) {
    res.status(403).json({ error: 'One or more photos not found or not owned by you' });
    return;
  }

  // Upsert each photo to avoid duplicate errors (idempotent)
  const results = await prisma.$transaction(
    photoIds.map((photoId: string) =>
      prisma.circlePhoto.upsert({
        where: { circleId_photoId: { circleId: id, photoId } },
        update: {},
        create: { circleId: id, photoId, uploadedBy: userId },
      })
    )
  );

  res.status(201).json({ added: results.length });
};

// ─── Delete Circle ────────────────────────────────────────────────────────────

export const deleteCircle = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }
  if (!membership.isCreator) {
    res.status(403).json({ error: 'Forbidden', message: 'Only the circle creator can delete this circle' });
    return;
  }

  await prisma.circle.delete({ where: { id } });

  res.json({ message: 'Circle deleted' });
};

// ─── Get Circle Photos ────────────────────────────────────────────────────────

export const getCirclePhotos = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }

  const [circlePhotos, total] = await Promise.all([
    prisma.circlePhoto.findMany({
      where: { circleId: id },
      include: {
        photo: { select: { storagePath: true, aiResult: { select: { caption: true } } } },
        uploader: {
          select: {
            id: true,
            name: true,
            profilePicUrl: true
          }
        },
      },
      orderBy: { uploadedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.circlePhoto.count({ where: { circleId: id } }),
  ]);

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const photos = await Promise.all(
    circlePhotos.map(async (cp) => {
      const thumbnailUrl = await storageService.getSignedUrl(
        'memories',
        cp.photo.storagePath,
        3600
      );

      return {
        id: cp.id,
        photoId: cp.photoId,
        uploadedBy: {
          id: cp.uploader.id,
          name: cp.uploader.name,
          profilePicUrl: await resolveProfilePicUrl(cp.uploader.profilePicUrl),
        },
        uploadedAt: cp.uploadedAt,
        isNew: cp.uploadedAt > twentyFourHoursAgo,
        thumbnailUrl,
        caption: cp.photo.aiResult?.caption ?? null,
      };
    })
  );

  res.json({
    photos,
    pagination: { page, limit, total, hasMore: skip + circlePhotos.length < total },
  });
};

// ─── Add Photo to Circle ──────────────────────────────────────────────────────

export const addPhoto = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;

  const parsed = AddCirclePhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.errors });
    return;
  }

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }

  const { photoId } = parsed.data;

  // Verify photo ownership
  const photo = await prisma.photo.findFirst({ where: { id: photoId, userId, deletedAt: null } });
  if (!photo) {
    res.status(403).json({ error: 'Forbidden', message: 'You can only share your own photos' });
    return;
  }

  // Check for duplicate
  const existing = await prisma.circlePhoto.findUnique({
    where: { circleId_photoId: { circleId: id, photoId } },
  });
  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'Photo is already in this circle' });
    return;
  }

  const circlePhoto = await prisma.circlePhoto.create({
    data: { circleId: id, photoId, uploadedBy: userId },
  });

  res.status(201).json({ circlePhoto });
};

// ─── Add Member ───────────────────────────────────────────────────────────────

export const addMember = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;

  const parsed = AddMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.errors });
    return;
  }

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }
  if (membership.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Only admins can perform this action' });
    return;
  }

  const { userId: targetUserId } = parsed.data;

  // Check target user exists
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    res.status(404).json({ error: 'Not found', message: 'User not found' });
    return;
  }

  // Check for duplicate
  const existing = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: id, userId: targetUserId } },
  });
  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'User is already a member of this circle' });
    return;
  }

  const member = await prisma.circleMember.create({
    data: { circleId: id, userId: targetUserId, role: 'member' },
  });

  res.status(201).json({ member });
};

// ─── Remove Member ────────────────────────────────────────────────────────────

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const targetUserId = req.params.userId!;
  const requesterId = req.user!.id;

  const [requesterMembership, targetMembership, circle] = await Promise.all([
    checkMembership(id, requesterId),
    checkMembership(id, targetUserId),
    prisma.circle.findUnique({ where: { id }, select: { createdBy: true } }),
  ]);

  if (!requesterMembership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }

  if (!targetMembership.isMember) {
    res.status(404).json({ error: 'Not found', message: 'Member not found' });
    return;
  }

  // Protect creator from removal
  if (circle?.createdBy === targetUserId) {
    res.status(403).json({ error: 'Forbidden', message: 'The circle creator cannot be removed' });
    return;
  }

  // Only admin or self can remove
  const isSelf = requesterId === targetUserId;
  if (!isSelf && requesterMembership.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Only admins can perform this action' });
    return;
  }

  await prisma.circleMember.delete({
    where: { circleId_userId: { circleId: id, userId: targetUserId } },
  });

  res.json({ message: 'Member removed' });
};

// ─── Get Circle Members ───────────────────────────────────────────────────────

export const getCircleMembers = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const userId = req.user!.id;

  const membership = await checkMembership(id, userId);
  if (!membership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }

  const [circle, members] = await Promise.all([
    prisma.circle.findUnique({ where: { id }, select: { createdBy: true } }),
    prisma.circleMember.findMany({
      where: { circleId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicUrl: true,
          },
        },
      },
    }),
  ]);

  if (!circle) {
    res.status(404).json({ error: 'Not found', message: 'Circle not found' });
    return;
  }

  // Sort: creator first, then admins, then members
  const withUrls = await Promise.all(
    members.map(async (m) => ({
      id: m.id,
      userId: m.userId,
      user: {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        profilePicUrl: await resolveProfilePicUrl(m.user.profilePicUrl),
      },
      role: m.role,
      isCreator: m.userId === circle.createdBy,
      joinedAt: m.joinedAt,
    }))
  );

  const sortedMembers = withUrls.sort((a, b) => {
      if (a.isCreator) return -1;
      if (b.isCreator) return 1;
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (b.role === 'admin' && a.role !== 'admin') return 1;
      return 0;
    });

  res.json({ members: sortedMembers });
};

// ─── Update Member Role ───────────────────────────────────────────────────────

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id!;
  const targetUserId = req.params.userId!;
  const requesterId = req.user!.id;

  const parsed = UpdateMemberRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.errors });
    return;
  }

  const { role } = parsed.data;

  const [requesterMembership, targetMembership, circle] = await Promise.all([
    checkMembership(id, requesterId),
    checkMembership(id, targetUserId),
    prisma.circle.findUnique({ where: { id }, select: { createdBy: true } }),
  ]);

  if (!requesterMembership.isMember) {
    res.status(403).json({ error: 'Forbidden', message: 'You are not a member of this circle' });
    return;
  }

  if (requesterMembership.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden', message: 'Only admins can update member roles' });
    return;
  }

  if (!targetMembership.isMember) {
    res.status(404).json({ error: 'Not found', message: 'Member not found' });
    return;
  }

  // Protect creator from demotion
  if (circle?.createdBy === targetUserId) {
    res.status(403).json({ error: 'Forbidden', message: 'The circle creator cannot be demoted' });
    return;
  }

  const updatedMember = await prisma.circleMember.update({
    where: { circleId_userId: { circleId: id, userId: targetUserId } },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicUrl: true,
        },
      },
    },
  });

  res.json({
    member: {
      id: updatedMember.id,
      userId: updatedMember.userId,
      user: {
        id: updatedMember.user.id,
        name: updatedMember.user.name,
        email: updatedMember.user.email,
        profilePicUrl: await resolveProfilePicUrl(updatedMember.user.profilePicUrl),
      },
      role: updatedMember.role,
      isCreator: updatedMember.userId === circle?.createdBy,
      joinedAt: updatedMember.joinedAt,
    },
  });
};