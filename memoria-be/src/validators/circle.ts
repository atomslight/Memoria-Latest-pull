import { z } from 'zod';

// Create Circle Schema
export const CreateCircleSchema = z.object({
  name: z.string()
    .min(1, 'Circle name is required')
    .max(100, 'Circle name must be less than 100 characters')
    .trim()
    .refine(val => val.trim().length > 0, 'Circle name cannot be whitespace only'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  emoji: z.string().emoji().optional().default('🔵'),
});

// Add Member Schema
export const AddMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Add Circle Photo Schema
export const AddCirclePhotoSchema = z.object({
  photoId: z.string().uuid('Invalid photo ID'),
});

// User Search Schema
export const UserSearchSchema = z.object({
  q: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters')
    .trim(),
});

// Update Member Role Schema
export const UpdateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be either "admin" or "member"' }),
  }),
});

// Type exports
export type CreateCircleInput = z.infer<typeof CreateCircleSchema>;
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
export type AddCirclePhotoInput = z.infer<typeof AddCirclePhotoSchema>;
export type UserSearchInput = z.infer<typeof UserSearchSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;