import {
  format,
  startOfDay,
  subDays,
  isSameDay,
} from 'date-fns';

/**
 * Timeline section interface for grouped memories
 */
export interface TimelineSection {
  date: string;           // ISO date (YYYY-MM-DD)
  displayDate: string;    // Formatted (Today, Yesterday, Jan 15)
  memories: any[];        // Memories for this date (typed as any for now, will be Memory[] when type is available)
}

/**
 * Group memories by their captured date
 * 
 * @param memories - Array of memories to group
 * @returns Array of timeline sections sorted in descending order (newest first)
 * 
 * @example
 * const memories = [
 *   { id: '1', capturedAt: '2024-01-15T10:00:00Z' },
 *   { id: '2', capturedAt: '2024-01-15T14:00:00Z' },
 *   { id: '3', capturedAt: '2024-01-14T10:00:00Z' },
 * ];
 * const sections = groupMemoriesByDate(memories);
 * // Returns:
 * // [
 * //   { date: '2024-01-15', displayDate: 'January 15, 2024', memories: [memory1, memory2] },
 * //   { date: '2024-01-14', displayDate: 'January 14, 2024', memories: [memory3] }
 * // ]
 */
export function groupMemoriesByDate(memories: any[]): TimelineSection[] {
  const groups = new Map<string, any[]>();
  
  // Group memories by date
  memories.forEach(memory => {
    const date = format(new Date(memory.capturedAt), 'yyyy-MM-dd');
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(memory);
  });
  
  // Convert to array and sort
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // Descending order (newest first)
    .map(([date, memories]) => ({
      date,
      displayDate: formatDisplayDate(date),
      memories: memories.sort((a, b) => 
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
      ),
    }));
}

/**
 * Format a date string for display in the timeline
 * 
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted display string (Today, Yesterday, or full date)
 * 
 * @example
 * formatDisplayDate('2024-01-15') // 'January 15, 2024'
 * formatDisplayDate(format(new Date(), 'yyyy-MM-dd')) // 'Today'
 * formatDisplayDate(format(subDays(new Date(), 1), 'yyyy-MM-dd')) // 'Yesterday'
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}
