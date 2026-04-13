import { z } from 'zod';
// Create Memory Schema
export const CreateMemorySchema = z.object({
  caption: z.string()
    .max(500, 'Caption must be less than 500 characters')
    .trim()
    .optional(),
  capturedAt: z.string().datetime('Invalid date format'),
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  locationName: z.string()
    .max(200, 'Location name must be less than 200 characters')
    .trim()
    .optional()
});

// Update Memory Schema
export const UpdateMemorySchema = z.object({
  caption: z.string()
    .max(500, 'Caption must be less than 500 characters')
    .trim()
    .optional(),
  capturedAt: z.string().datetime('Invalid date format').optional(),
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  locationName: z.string()
    .max(200, 'Location name must be less than 200 characters')
    .trim()
    .optional()
});

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

// Search Schema
export const SearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must be less than 200 characters')
    .trim(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.string().max(200).trim().optional(),
  hasCaption: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

// Upload Schema
export const UploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  mimeType: z.string()
    .regex(/^image\/(jpeg|jpg|png|heic|heif)$/, 'Invalid image type'),
  hash: z.string().min(1, 'File hash is required')
});

// Batch Delete Schema
export const BatchDeleteSchema = z.object({
  memoryIds: z.array(z.string().uuid('Invalid memory ID'))
    .min(1, 'At least one memory ID is required')
    .max(100, 'Cannot delete more than 100 memories at once')
});

// Upload Memory Metadata Schema
export const UploadMemoryMetaSchema = z.object({
  mood: z.string().optional(),
  cluster: z.string().optional(),
  locationName: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

// Type exports
export type CreateMemoryInput = z.infer<typeof CreateMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof UpdateMemorySchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type UploadInput = z.infer<typeof UploadSchema>;
export type BatchDeleteInput = z.infer<typeof BatchDeleteSchema>;
export type UploadMemoryMetaInput = z.infer<typeof UploadMemoryMetaSchema>;