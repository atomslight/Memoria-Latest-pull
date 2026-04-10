import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/auth';
import {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  uploadAvatar,
  logout,
} from '../../controllers/v1/authController';

const router = Router();

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
 * POST /register — email + password; returns access token (+ refresh when configured)
 */
router.post('/register', register);

/**
 * POST /login — returns access token (and refresh token when configured)
 */
router.post('/login', login);

/**
 * POST /refresh — { refreshToken } → new access + refresh tokens
 */
router.post('/refresh', refresh);

/**
 * GET /me - Get current user profile
 * Returns id, email, name, bio, profilePicUrl, createdAt
 */
router.get('/me', authMiddleware, getMe);

/**
 * PATCH /profile - Update user profile (name, bio, profilePicUrl)
 */
router.patch('/profile', authMiddleware, updateProfile);

/**
 * POST /profile/avatar - Upload profile picture
 * Saves under local storage avatars/{userId}/avatar.{ext}
 * Updates user.profilePicUrl in DB
 */
router.post('/profile/avatar', authMiddleware, avatarUpload.single('avatar'), uploadAvatar);

/**
 * POST /logout - Sign out the current user
 */
router.post('/logout', authMiddleware, logout);

export { router as authRouter };