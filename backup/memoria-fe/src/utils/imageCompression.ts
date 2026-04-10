/**
 * Image Compression Utility
 * 
 * Client-side image compression for React Native CLI
 */

import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';

export interface CompressionOptions {
  maxWidth?: number;
  quality?: number;
  timeoutMs?: number;
}

export interface CompressionResult {
  uri: string;
  originalSize: number;
  compressedSize: number;
  reductionPercent: number;
  skipped: boolean;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 2048,
  quality: 0.8,
  timeoutMs: 5000,
};

/**
 * Compress a single image
 * 
 * @param imageUri - URI of the image to compress
 * @param options - Compression options
 * @returns Compression result with URI and size stats
 */
export async function compressImage(
  imageUri: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const normalizedUri = imageUri.startsWith('file://')
      ? imageUri.replace('file://', '')
      : imageUri;
    const originalStat = await RNFS.stat(normalizedUri);
    const originalSize = Number(originalStat.size) || 0;
    if (!originalSize) throw new Error('File not found or size unavailable');

    // Skip compression if file is already small (< 500KB)
    if (originalSize < 500 * 1024) {
      return {
        uri: imageUri,
        originalSize,
        compressedSize: originalSize,
        reductionPercent: 0,
        skipped: true,
      };
    }

    // Compress with timeout
    const compressionPromise = ImageResizer.createResizedImage(
      imageUri,
      opts.maxWidth,
      opts.maxWidth,
      'JPEG',
      Math.round(opts.quality * 100)
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Compression timeout')), opts.timeoutMs)
    );

    const result = await Promise.race([compressionPromise, timeoutPromise]);

    // Get compressed file size
    const compressedNormalized = result.uri.startsWith('file://')
      ? result.uri.replace('file://', '')
      : result.uri;
    const compressedStat = await RNFS.stat(compressedNormalized);
    const compressedSize = Number(compressedStat.size) || 0;
    if (!compressedSize) throw new Error('Compressed file not found');
    const reductionPercent = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    return {
      uri: result.uri,
      originalSize,
      compressedSize,
      reductionPercent,
      skipped: false,
    };
  } catch (error) {
    console.error('Compression error:', error);
    
    // Fallback to original on any error
    const normalizedUri = imageUri.startsWith('file://')
      ? imageUri.replace('file://', '')
      : imageUri;
    let size = 0;
    try {
      const stat = await RNFS.stat(normalizedUri);
      size = Number(stat.size) || 0;
    } catch {
      size = 0;
    }

    return {
      uri: imageUri,
      originalSize: size,
      compressedSize: size,
      reductionPercent: 0,
      skipped: true,
    };
  }
}

/**
 * Compress multiple images sequentially
 * 
 * @param imageUris - Array of image URIs to compress
 * @param onProgress - Optional progress callback
 * @param options - Compression options
 * @returns Array of compression results
 */
export async function compressBatch(
  imageUris: string[],
  onProgress?: (completed: number, total: number) => void,
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  const total = imageUris.length;

  for (let i = 0; i < imageUris.length; i++) {
    const result = await compressImage(imageUris[i], options);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return results;
}
