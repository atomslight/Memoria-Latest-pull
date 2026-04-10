/**
 * LoadingSkeleton Component
 * 
 * Displays a skeleton loader while the timeline is loading.
 * Shows a date header placeholder and grid of memory placeholders.
 * 
 * Requirements: 8.1, 10.1, 10.3
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

export function LoadingSkeleton() {
  const { width } = useWindowDimensions();
  const itemWidth = (width - SPACING.md * 4) / 3; // 3 columns with gaps

  return (
    <View style={styles.container}>
      {/* Date header skeleton */}
      <View style={styles.dateHeader} />
      
      {/* Grid skeleton - 9 items (3 rows × 3 columns) */}
      <View style={styles.grid}>
        {[...Array(9)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.gridItem,
              {
                width: itemWidth,
                height: itemWidth,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  dateHeader: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  gridItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
});
