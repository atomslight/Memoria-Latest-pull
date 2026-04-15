import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export const getFaceGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const groups = await prisma.face_groups.findMany({
      where: { user_id: userId },
      include: {
        _count: {
          select: { faces: true }
        },
        faces: {
          take: 1,
          select: { photoId: true, id: true }
        }
      }
    });

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch face groups' });
  }
};

export const getFaceGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const group = await prisma.face_groups.findFirst({
      where: { id, user_id: userId },
      include: {
        faces: {
          include: { photo: true }
        }
      }
    });

    if (!group) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch face group' });
  }
};

export const updateFaceGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name } = req.body;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const group = await prisma.face_groups.updateMany({
      where: { id, user_id: userId },
      data: { name }
    });

    if (group.count === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update face group' });
  }
};
