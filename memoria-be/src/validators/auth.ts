import { z } from 'zod';

// Password validation with strength requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Email validation
const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

// Signup Schema
export const SignupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional()
});

// Login Schema
export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Refresh token (body)
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

// Password Reset Request Schema
export const PasswordResetRequestSchema = z.object({
  email: emailSchema
});

// Password Reset Schema
export const PasswordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema
});

// Update Profile Schema
export const UpdateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  email: emailSchema.optional(),
  bio: z.string().max(150).optional(),
  profilePicUrl: z.string().url().optional(),
});

// Type exports
export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// Legacy exports for backward compatibility
export const signUpSchema = SignupSchema;
export const loginSchema = LoginSchema;
export type SignUpSchema = SignupInput;
export type LoginSchema = LoginInput;