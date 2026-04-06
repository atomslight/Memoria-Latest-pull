import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

// Day-of-week labels (Mon → Sun)
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getCellColor(count: number): string {
  if (count === 0) return COLORS.surface;   // #18181B
  if (count === 1) return '#3D3000';
  if (count === 2) return '#7A6000';
  return COLORS.brandYellow;               // 3+ → #FFE600
}

export function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  // Pad or trim to exactly 84 entries (12 weeks × 7 days)
  const cells = Array.from({ length: 84 }, (_, i) => data[i] ?? { date: '', count: 0 });

  // Build 12 columns of 7 days each
  // Column 0 = days 0-6 (oldest), column 11 = days 77-83 (most recent)
  const columns: { date: string; count: number }[][] = Array.from({ length: 12 }, (_, col) =>
    cells.slice(col * 7, col * 7 + 7)
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {/* Day-of-week labels column */}
        <View style={styles.labelsColumn}>
          {DAY_LABELS.map((label, i) => (
            <Text key={i} style={styles.dayLabel}>
              {label}
            </Text>
          ))}
        </View>

        {/* 12 week columns */}
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={styles.column}>
            {col.map((cell, rowIdx) => (
              <View
                key={rowIdx}
                style={[styles.cell, { backgroundColor: getCellColor(cell.count) }]}
              />
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.caption}>Last 12 weeks</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  labelsColumn: {
    marginRight: SPACING.xs,
  },
  dayLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    width: 10,
    height: 10,
    lineHeight: 10,
    fontSize: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  column: {
    flexDirection: 'column',
    marginRight: 2,
  },
  cell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginBottom: 2,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default ActivityHeatmap;
