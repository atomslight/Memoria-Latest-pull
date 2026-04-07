/**
 * Memory Type Definition
 * 
 * Defines the structure of a memory object in the Memoria app.
 * This is a temporary type definition until @memoria/shared package is properly configured.
 */

export interface Memory {
  id: string;
  userId: string;
  hash: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  capturedAt: Date | string;
  caption?: string | null;
  mood?: string | null;
  cluster?: string | null;
  locationName?: string | null;
  captionStatus?: 'pending' | 'completed' | 'failed' | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  thumbnailSmall?: string;
  thumbnailMedium?: string;
  thumbnailLarge?: string;
  exif?: Record<string, any>;
}
