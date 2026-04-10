/**
 * DateSection Component
 * 
 * Wrapper component that combines DateHeader and MemoryGrid.
 * Represents a single date section in the timeline with its header and memory grid.
 * 
 * Requirements: 2.1
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DateHeader } from './DateHeader';
import { MemoryGrid } from './MemoryGrid';
import type { Memory } from '../../types/memory';

export interface TimelineSection {
  date: string;           // ISO date string (YYYY-MM-DD)
  displayDate: string;    // Formatted display (Today, Yesterday, Jan 15)
  memories: Memory[];     // Memories for this date
}

export interface DateSectionProps {
  section: TimelineSection;
  onMemoryPress?: (memory: Memory) => void;
}

export function DateSection({ section, onMemoryPress }: DateSectionProps) {
  return (
    <View style={styles.section}>
      <DateHeader 
        displayDate={section.displayDate} 
        count={section.memories.length} 
      />
      <MemoryGrid memories={section.memories} onMemoryPress={onMemoryPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    // No additional styling needed - children handle their own layout
  },
});
