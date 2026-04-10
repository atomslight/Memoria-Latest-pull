import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware } from '../../middleware/auth';
import { storageService } from '../../services/storage';
import { prisma } from '../../config/database';
import { UpdateProfileSchema } from '../../validators';

const router: RouterType = Router();

// Configure multer for avatar uploads (memory storage, 5MB limit)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

/**
 * GET /me - Get current user profile
 * Returns id, email, name, bio, profilePicUrl, createdAt
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profilePicUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      profilePicUrl: user.profilePicUrl,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * PATCH /profile - Update user profile (name, bio, profilePicUrl)
 */
router.patch('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, bio, profilePicUrl } = parsed.data;

    // Build update object with only provided fields
    const updateData: { name?: string; bio?: string; profilePicUrl?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicUrl !== undefined) updateData.profilePicUrl = profilePicUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profilePicUrl: true,
      },
    });

    res.status(200).json({ user });
  } catch (err) {
    console.error('PATCH /profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /profile/avatar - Upload profile picture
 * Uploads to Supabase Storage 'avatars' bucket at {userId}/avatar.{ext}
 * Updates user.profilePicUrl in DB
 */
router.post(
  '/profile/avatar',
  authMiddleware,
  avatarUpload.single('avatar'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const userId = req.user!.id;
      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const storagePath = `${userId}/avatar${ext}`;

      await storageService.uploadFile('avatars', storagePath, req.file.buffer, req.file.mimetype, {
        upsert: true,
      });

      const profilePicUrl = await storageService.getPublicUrl('avatars', storagePath);

      // Update user record
      await prisma.user.update({
        where: { id: userId },
        data: { profilePicUrl },
      });

      res.status(200).json({ profilePicUrl });
    } catch (err) {
      console.error('POST /profile/avatar error:', err);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  }
);

/**
 * POST /logout - Sign out the current user
 */
router.post('/logout', authMiddleware, async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export { router as authRouter };
