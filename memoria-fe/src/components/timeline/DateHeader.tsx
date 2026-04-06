/**
 * DateHeader Component
 * 
 * Sticky header showing date and memory count for a timeline section.
 * Displays "Today", "Yesterday", or formatted date (e.g., "January 15, 2024").
 * 
 * Requirements: 2.2, 2.3, 2.4, 10.1, 10.2
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';

export interface DateHeaderProps {
  displayDate: string;
  count: number;
}

export function DateHeader({ displayDate, count }: DateHeaderProps) {
  return (
    <View style={styles.dateHeader}>
      <Text style={styles.dateText}>
        {displayDate}
      </Text>
      <Text style={styles.countText}>
        {count} {count === 1 ? 'memory' : 'memories'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dateHeader: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  countText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
  },
});
