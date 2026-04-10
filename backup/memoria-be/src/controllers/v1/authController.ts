import { Request, Response } from 'express';
import path from 'path';
import bcrypt from 'bcrypt';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { storageService } from '../../services/storage';
import { resolveProfilePicUrl } from '../../helpers/mediaUrl';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../services/jwt';
import {
  UpdateProfileSchema,
  SignupSchema,
  LoginSchema,
  RefreshTokenSchema,
} from '../../validators';

function issueAuthTokens(user: { id: string; email: string }) {
  const accessToken = signAccessToken(user);
  if (env.jwtPairMode) {
    return { accessToken, refreshToken: signRefreshToken(user) };
  }
  return { accessToken };
}

/**
 * POST /register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
      },
      select: { id: true, email: true, name: true },
    });

    res.status(201).json({
      ...issueAuthTokens({ id: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('POST /register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * POST /login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    res.status(200).json({
      ...issueAuthTokens({ id: user.id, email: user.email }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('POST /login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * POST /refresh — body: { refreshToken }; returns new access (+ refresh) tokens when pair mode is configured
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!env.jwtPairMode) {
      res.status(501).json({ error: 'Refresh tokens are not configured' });
      return;
    }

    const parsed = RefreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    let payload: { sub: string; email: string };
    try {
      payload = verifyRefreshToken(parsed.data.refreshToken);
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user || user.email !== payload.email) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    res.status(200).json({
      accessToken: signAccessToken({ id: user.id, email: user.email }),
      refreshToken: signRefreshToken({ id: user.id, email: user.email }),
    });
  } catch (err) {
    console.error('POST /refresh error:', err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

/**
 * GET /me - Get current user profile
 */
export const getMe = async (req: Request, res: Response) => {
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
      profilePicUrl: await resolveProfilePicUrl(user.profilePicUrl),
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

/**
 * PATCH /profile - Update user profile (name, bio, profilePicUrl)
 */
export const updateProfile = async (req: Request, res: Response) => {
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

    res.status(200).json({
      user: {
        ...user,
        profilePicUrl: await resolveProfilePicUrl(user.profilePicUrl),
      },
    });
  } catch (err) {
    console.error('PATCH /profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * POST /profile/avatar — uploads to S3 under avatars/{userId}/avatar.{ext}
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user!.id;
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const storagePath = `${userId}/avatar${ext}`;
    const storedKey = `avatars/${storagePath}`;

    await storageService.uploadFile('avatars', storagePath, req.file.buffer, req.file.mimetype, {
      upsert: true,
    });

    await prisma.user.update({
      where: { id: userId },
      data: { profilePicUrl: storedKey },
    });

    res.status(200).json({
      profilePicUrl: await resolveProfilePicUrl(storedKey),
    });
  } catch (err) {
    console.error('POST /profile/avatar error:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
};

/**
 * POST /logout - Stateless JWT: client discards the token
 */
export const logout = async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};
