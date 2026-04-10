/**
 * MemoryThumbnail Component
 * 
 * Individual memory card with thumbnail and optional caption overlay.
 * Optimized for performance with expo-image and haptic feedback.
 * 
 * Features:
 * - Optimized image loading with expo-image
 * - Blurhash placeholder
 * - Caption overlay (if caption exists)
 * - Tap to navigate to detail view
 * - Haptic feedback on press
 * 
 * Requirements: 1.2, 1.4, 6.1, 10.4, 10.5
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import type { Memory } from '../../types/memory';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS, SHADOWS } from '../../constants/shadows';
import { TYPOGRAPHY } from '../../constants/typography';

export interface MemoryThumbnailProps {
  memory: Memory;
  width: number;
  onPress?: () => void;
}

export function MemoryThumbnail({ memory, width, onPress }: MemoryThumbnailProps) {
  const handlePress = () => {
    // Haptic feedback for better UX
    try {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch {
      // ignore
    }
    
    // Use custom onPress if provided, otherwise navigate to detail view
    if (onPress) {
      onPress();
    }
  };
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, { width, height: width }]}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Memory from ${memory.capturedAt ? new Date(memory.capturedAt).toLocaleDateString() : 'unknown date'}`}
      accessibilityHint="Double tap to view full memory details"
    >
      <Image
        source={{ uri: memory.thumbnailMedium }}
        style={styles.image}
        resizeMode="cover"
      />
      
      {memory.caption && memory.captionStatus === 'completed' && (
        <View style={styles.captionOverlay}>
          <Text 
            style={styles.captionText} 
            numberOfLines={2}
            accessibilityLabel={`Caption: ${memory.caption}`}
          >
            {memory.caption}
          </Text>
        </View>
      )}
      
      {memory.captionStatus === 'pending' && (
        <View style={styles.captionOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.brandYellow} />
            <Text style={styles.loadingText}>Generating caption...</Text>
          </View>
        </View>
      )}
      
      {memory.captionStatus === 'failed' && (
        <View style={styles.captionOverlay}>
          <Text style={styles.failedText}>Caption unavailable</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING.sm,
  },
  captionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 11,
  },
  failedText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
});
