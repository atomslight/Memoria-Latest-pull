/**
 * MemoryGrid Component
 * 
 * 3-column grid layout for memory thumbnails.
 * Calculates responsive item width based on screen size.
 * 
 * Features:
 * - 3 columns with equal width
 * - 8px gap between items (SPACING.sm)
 * - Aspect ratio 1:1 (square)
 * - Responsive to screen width
 * 
 * Requirements: 1.1, 1.3, 10.3
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { MemoryThumbnail } from './MemoryThumbnail';
import type { Memory } from '../../types/memory';
import { SPACING } from '../../constants';

export interface MemoryGridProps {
  memories: Memory[];
  onMemoryPress?: (memory: Memory) => void;
}

export function MemoryGrid({ memories, onMemoryPress }: MemoryGridProps) {
  const { width } = useWindowDimensions();
  
  // Calculate item width for 3 columns with gaps
  // Formula: (screen width - (4 gaps × 8px)) / 3 columns
  // 4 gaps: left padding, 2 between columns, right padding
  const itemWidth = (width - SPACING.sm * 4) / 3;
  
  return (
    <View style={styles.grid}>
      {memories.map((memory) => (
        <MemoryThumbnail 
          key={memory.id} 
          memory={memory} 
          width={itemWidth}
          onPress={() => onMemoryPress?.(memory)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm, // 8px gap between items
  },
});
