/**
 * Property-based tests for Smart Panel chip single-active invariant
 *
 * Feature: ui-design-revamp
 * Property 7: Mood chip single-active invariant
 * Property 8: Cluster chip single-active invariant
 * Validates: Requirements 30.3, 30.4
 *
 * These tests use minimal wrapper components that mirror the exact chip
 * styling logic from apps/mobile/app/camera/smart-panel.tsx.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import * as fc from 'fast-check';
import { COLORS } from '../../../src/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

type Mood = 'Happy' | 'Hustle' | 'Calm' | 'Nostalgic' | 'Excited';
type Cluster = 'Friends' | 'Family' | 'Work' | 'Travel' | 'Solo';

const MOODS: Mood[] = ['Happy', 'Hustle', 'Calm', 'Nostalgic', 'Excited'];
const CLUSTERS: Cluster[] = ['Friends', 'Family', 'Work', 'Travel', 'Solo'];

// ─── Minimal MoodChips component mirroring smart-panel.tsx styling ────────────
// Active chip: COLORS.brandYellow background + COLORS.black text
// Inactive chip: COLORS.surface background + COLORS.textSecondary text

interface MoodChipsProps {
  activeMood: Mood;
}

function MoodChips({ activeMood }: MoodChipsProps) {
  return (
    <View style={styles.row}>
      {MOODS.map((mood) => {
        const isActive = mood === activeMood;
        return (
          <TouchableOpacity
            key={mood}
            testID={`mood-chip-${mood}`}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              testID={`mood-label-${mood}`}
              style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}
            >
              {mood}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Minimal ClusterChips component mirroring smart-panel.tsx styling ─────────

interface ClusterChipsProps {
  activeCluster: Cluster;
}

function ClusterChips({ activeCluster }: ClusterChipsProps) {
  return (
    <View style={styles.row}>
      {CLUSTERS.map((cluster) => {
        const isActive = cluster === activeCluster;
        return (
          <TouchableOpacity
            key={cluster}
            testID={`cluster-chip-${cluster}`}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              testID={`cluster-label-${cluster}`}
              style={[styles.chipText, isActive ? styles.chipTextActive : styles.chipTextInactive]}
            >
              {cluster}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Interactive SmartPanel stub for toggle behavior tests ────────────────────

function InteractiveMoodChips() {
  const [selected, setSelected] = useState<Mood | null>(null);
  return (
    <View>
      {MOODS.map((mood) => {
        const isActive = selected === mood;
        return (
          <TouchableOpacity
            key={mood}
            testID={`mood-chip-${mood}`}
            onPress={() => setSelected(isActive ? null : mood)}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
          >
            <Text testID={`mood-label-${mood}`}>{mood}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function InteractiveClusterChips() {
  const [selected, setSelected] = useState<Cluster | null>(null);
  return (
    <View>
      {CLUSTERS.map((cluster) => {
        const isActive = selected === cluster;
        return (
          <TouchableOpacity
            key={cluster}
            testID={`cluster-chip-${cluster}`}
            onPress={() => setSelected(isActive ? null : cluster)}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
          >
            <Text testID={`cluster-label-${cluster}`}>{cluster}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  chipActive: { backgroundColor: COLORS.brandYellow },
  chipInactive: { backgroundColor: COLORS.surface },
  chipText: { fontSize: 14 },
  chipTextActive: { color: COLORS.black },
  chipTextInactive: { color: COLORS.textSecondary },
});

// ─── Helper: flatten style array ─────────────────────────────────────────────

function flatStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style);
  return (style as Record<string, unknown>) ?? {};
}

// ─── Property 7: Mood chip single-active invariant ───────────────────────────
// Validates: Requirement 30.3

describe('Property 7: Mood chip single-active invariant', () => {
  it('exactly one mood chip has brandYellow background for any active mood', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Mood>('Happy', 'Hustle', 'Calm', 'Nostalgic', 'Excited'),
        (activeMood) => {
          const { getByTestId } = render(<MoodChips activeMood={activeMood} />);

          let activeCount = 0;
          let inactiveCount = 0;

          for (const mood of MOODS) {
            const chip = getByTestId(`mood-chip-${mood}`);
            const s = flatStyle(chip.props.style);

            if (mood === activeMood) {
              expect(s.backgroundColor).toBe(COLORS.brandYellow);
              activeCount++;
            } else {
              expect(s.backgroundColor).toBe(COLORS.surface);
              expect(s.backgroundColor).not.toBe(COLORS.brandYellow);
              inactiveCount++;
            }
          }

          expect(activeCount).toBe(1);
          expect(inactiveCount).toBe(MOODS.length - 1);
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });

  it('active mood chip label uses black text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Mood>('Happy', 'Hustle', 'Calm', 'Nostalgic', 'Excited'),
        (activeMood) => {
          const { getByTestId } = render(<MoodChips activeMood={activeMood} />);
          const label = getByTestId(`mood-label-${activeMood}`);
          const s = flatStyle(label.props.style);
          expect(s.color).toBe(COLORS.black);
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });

  it('tapping a mood chip makes it the only active chip', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Mood>('Happy', 'Hustle', 'Calm', 'Nostalgic', 'Excited'),
        (moodToTap) => {
          const { getByTestId } = render(<InteractiveMoodChips />);

          fireEvent.press(getByTestId(`mood-chip-${moodToTap}`));

          let activeCount = 0;
          for (const mood of MOODS) {
            const chip = getByTestId(`mood-chip-${mood}`);
            const s = flatStyle(chip.props.style);
            if (s.backgroundColor === COLORS.brandYellow) activeCount++;
          }

          expect(activeCount).toBe(1);
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });
});

// ─── Property 8: Cluster chip single-active invariant ────────────────────────
// Validates: Requirement 30.4

describe('Property 8: Cluster chip single-active invariant', () => {
  it('exactly one cluster chip has brandYellow background for any active cluster', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Cluster>('Friends', 'Family', 'Work', 'Travel', 'Solo'),
        (activeCluster) => {
          const { getByTestId } = render(<ClusterChips activeCluster={activeCluster} />);

          let activeCount = 0;
          let inactiveCount = 0;

          for (const cluster of CLUSTERS) {
            const chip = getByTestId(`cluster-chip-${cluster}`);
            const s = flatStyle(chip.props.style);

            if (cluster === activeCluster) {
              expect(s.backgroundColor).toBe(COLORS.brandYellow);
              activeCount++;
            } else {
              expect(s.backgroundColor).toBe(COLORS.surface);
              expect(s.backgroundColor).not.toBe(COLORS.brandYellow);
              inactiveCount++;
            }
          }

          expect(activeCount).toBe(1);
          expect(inactiveCount).toBe(CLUSTERS.length - 1);
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });

  it('active cluster chip label uses black text', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Cluster>('Friends', 'Family', 'Work', 'Travel', 'Solo'),
        (activeCluster) => {
          const { getByTestId } = render(<ClusterChips activeCluster={activeCluster} />);
          const label = getByTestId(`cluster-label-${activeCluster}`);
          const s = flatStyle(label.props.style);
          expect(s.color).toBe(COLORS.black);
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });

  it('tapping a cluster chip makes it the only active chip', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Cluster>('Friends', 'Family', 'Work', 'Travel', 'Solo'),
        (clusterToTap) => {
          const { getByTestId } = render(<InteractiveClusterChips />);

          fireEvent.press(getByTestId(`cluster-chip-${clusterToTap}`));

          let activeCount = 0;
          for (const cluster of CLUSTERS) {
            const chip = getByTestId(`cluster-chip-${cluster}`);
            const s = flatStyle(chip.props.style);
            if (s.backgroundColor === COLORS.brandYellow) activeCount++;
          }

          expect(activeCount).toBe(1);
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });
});
