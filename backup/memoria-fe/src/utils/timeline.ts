/**
 * Timeline Utility Functions
 * 
 * Utilities for grouping memories by date and formatting display dates.
 * Used by the TimelineScreen component.
 */

import { format, startOfDay, subDays, isSameDay } from 'date-fns';
import type { Memory } from '../types/memory';

export interface TimelineSection {
  date: string;           // ISO date string (YYYY-MM-DD)
  displayDate: string;    // Formatted display (Today, Yesterday, Jan 15)
  memories: Memory[];     // Memories for this date
}

/**
 * Group memories by their captured date
 * 
 * @param memories - Array of memories to group
 * @returns Array of timeline sections sorted in descending order (newest first)
 * 
 * @example
 * const sections = groupMemoriesByDate(memories);
 * // Returns: [
 * //   { date: '2024-01-15', displayDate: 'Today', memories: [...] },
 * //   { date: '2024-01-14', displayDate: 'Yesterday', memories: [...] }
 * // ]
 */
export function groupMemoriesByDate(memories: Memory[]): TimelineSection[] {
  const groups = new Map<string, Memory[]>();
  
  // Group memories by date
  memories.forEach(memory => {
    if (!memory.capturedAt) return;
    
    const date = format(new Date(memory.capturedAt), 'yyyy-MM-dd');
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(memory);
  });
  
  // Convert to sections and sort
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // Descending order (newest first)
    .map(([date, memories]) => ({
      date,
      displayDate: formatDisplayDate(date),
      memories: memories.sort((a, b) => {
        // Sort memories within section by capturedAt descending
        const dateA = a.capturedAt ? new Date(a.capturedAt).getTime() : 0;
        const dateB = b.capturedAt ? new Date(b.capturedAt).getTime() : 0;
        return dateB - dateA;
      }),
    }));
}

/**
 * Format a date string for display in the timeline
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted display date (Today, Yesterday, or full date)
 * 
 * @example
 * formatDisplayDate('2024-01-15') // "Today" (if today)
 * formatDisplayDate('2024-01-14') // "Yesterday" (if yesterday)
 * formatDisplayDate('2024-01-10') // "January 10, 2024"
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}
