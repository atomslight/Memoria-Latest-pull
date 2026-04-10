/**
 * ImageViewer Component
 * 
 * Full-screen image viewer with swipe navigation and caption display.
 * 
 * Features:
 * - Swipe left/right to navigate between images
 * - Caption overlay with status indicator
 * - Close button
 * - Image counter (1 of 10)
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Dimensions, ActivityIndicator, StatusBar, PanResponder,
  Animated, ScrollView, Alert,
} from 'react-native';
import { Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants';
import type { Memory } from '../types/memory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface ImageViewerProps {
  visible: boolean;
  memories: Memory[];
  initialIndex: number;
  onClose: () => void;
}

export function ImageViewer({ visible, memories, initialIndex, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showCaption, setShowCaption] = useState(true);
  const translateX = useRef(new Animated.Value(0)).current;

  const currentMemory = memories[currentIndex];

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        
        // Swipe right (previous image)
        if ((dx > SWIPE_THRESHOLD || vx > 0.5) && currentIndex > 0) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex(currentIndex - 1);
            translateX.setValue(0);
          });
        }
        // Swipe left (next image)
        else if ((dx < -SWIPE_THRESHOLD || vx < -0.5) && currentIndex < memories.length - 1) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setCurrentIndex(currentIndex + 1);
            translateX.setValue(0);
          });
        }
        // Snap back
        else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    translateX.setValue(0);
    setCurrentIndex(initialIndex);
    onClose();
  };

  const handleEdit = () => Alert.alert('Edit', 'Edit memory coming soon');
  const handleDelete = () => Alert.alert('Delete', 'Delete this memory?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { /* TODO */ } },
  ]);

  if (!visible || !currentMemory) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.counter}>
            {currentIndex + 1} of {memories.length}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction} onPress={handleEdit}>
              <Ionicons name="pencil-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={() => setShowCaption(!showCaption)}>
              <Ionicons name={showCaption ? 'eye-outline' : 'eye-off-outline'} size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image with swipe */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: currentMemory.thumbnailLarge || currentMemory.thumbnailMedium }}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Caption Overlay */}
        {showCaption && (
          <View style={styles.captionContainer}>
            {/* Caption Status */}
            {currentMemory.captionStatus === 'completed' && currentMemory.caption && (
              <View style={styles.captionContent}>
                <View style={styles.captionHeader}>
                  <Ionicons name="sparkles" size={16} color={COLORS.brandYellow} />
                  <Text style={styles.captionLabel}>AI Caption</Text>
                </View>
                <Text style={styles.captionText}>{currentMemory.caption}</Text>
              </View>
            )}

            {currentMemory.captionStatus === 'pending' && (
              <View style={styles.captionContent}>
                <View style={styles.captionLoading}>
                  <ActivityIndicator size="small" color={COLORS.brandYellow} />
                  <Text style={styles.captionLoadingText}>Generating caption...</Text>
                </View>
              </View>
            )}

            {currentMemory.captionStatus === 'failed' && (
              <View style={styles.captionContent}>
                <View style={styles.captionFailed}>
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
                  <Text style={styles.captionFailedText}>Caption unavailable</Text>
                </View>
              </View>
            )}

            {/* Metadata chips row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {/* Date chip — always shown */}
              {currentMemory.capturedAt && (
                <View style={styles.chip}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.chipText}>
                    {new Date(currentMemory.capturedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              )}

              {/* Mood chip — shown if mood selected by user/ generated by ai */}
              {(currentMemory as any).mood && (
                <View style={[styles.chip, styles.chipMood]}>
                  <Text style={styles.chipMoodText}>{(currentMemory as any).mood}</Text>
                </View>
              )}
			  
              {/* Cluster chip — shown if cluster exists */}
              {(currentMemory as any).cluster && (
                <View style={styles.chip}>
                  <Ionicons name="grid-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.chipText}>{(currentMemory as any).cluster}</Text>
                </View>
              )}

              {/* Location chip */}
              {(currentMemory as any).locationName ? (
                <View style={styles.chip}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.chipText}>{(currentMemory as any).locationName}</Text>
                </View>
              ) : (
                <TouchableOpacity style={[styles.chip, styles.chipAdd]}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.chipText}>Add Location</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* Navigation Hints */}
        {memories.length > 1 && (
          <View style={styles.navigationHints}>
            {currentIndex > 0 && (
              <View style={[styles.navHint, styles.navHintLeft]}>
                <Ionicons name="chevron-back" size={24} color={COLORS.white} />
              </View>
            )}
            {currentIndex < memories.length - 1 && (
              <View style={[styles.navHint, styles.navHintRight]}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  counter: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerAction: {
    padding: SPACING.sm,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    zIndex: 10,
  },
  captionContent: {
    marginBottom: SPACING.md,
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  captionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.brandYellow,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  captionText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    lineHeight: 24,
  },
  captionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  captionLoadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.gray400,
    fontStyle: 'italic',
  },
  captionFailed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  captionFailedText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.error,
    fontStyle: 'italic',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipAdd: {
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderStyle: 'dashed',
  },
  chipMood: {
    backgroundColor: COLORS.brandYellow,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  chipMoodText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.black,
    fontWeight: '600',
  },
  navigationHints: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    pointerEvents: 'none',
  },
  navHint: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navHintLeft: {
    marginRight: 'auto',
  },
  navHintRight: {
    marginLeft: 'auto',
  },
});
