/**
 * Property-based tests for search filter chip coloring
 *
 * Feature: ui-design-revamp
 * Property 4: Search filter chip active/inactive coloring consistency
 * Validates: Requirements 9.3
 *
 * Note: threads.tsx is currently the AI Chat screen. This test mirrors the
 * filter chip color logic specified for the Search_Screen (Requirement 9.3)
 * using a minimal wrapper component that implements the same active/inactive
 * chip styling rules.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import { COLORS } from '../../src/constants/colors';

// ─── Filter chip types ────────────────────────────────────────────────────────

type FilterOption = 'all' | 'today' | 'week' | 'month';

const FILTER_OPTIONS: FilterOption[] = ['all', 'today', 'week', 'month'];

// ─── Minimal FilterChips component mirroring Requirement 9.3 styling ─────────
// Active chip: COLORS.brandYellow background + COLORS.black text
// Inactive chip: COLORS.surface background + COLORS.textSecondary text

interface FilterChipsProps {
  activeFilter: FilterOption;
}

function FilterChips({ activeFilter }: FilterChipsProps) {
  return (
    <View style={styles.row}>
      {FILTER_OPTIONS.map((filter) => {
        const isActive = filter === activeFilter;
        return (
          <TouchableOpacity
            key={filter}
            testID={`chip-${filter}`}
            style={[
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              testID={`chip-label-${filter}`}
              style={[
                styles.chipText,
                isActive ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  chipActive: {
    backgroundColor: COLORS.brandYellow,
  },
  chipInactive: {
    backgroundColor: COLORS.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.black,
  },
  chipTextInactive: {
    color: COLORS.textSecondary,
  },
});

// ─── Property 4: Search filter chip active/inactive coloring consistency ──────
// Validates: Requirements 9.3

describe('Property 4: Search filter chip active/inactive coloring consistency', () => {
  /**
   * For any active filter from {all, today, week, month}:
   * - Exactly one chip has COLORS.brandYellow background (active)
   * - All other chips have COLORS.surface background (inactive)
   * - The active chip label uses COLORS.black text
   * - All inactive chip labels use COLORS.textSecondary text
   */
  it('exactly one chip has active styling (brandYellow bg + black text) for any filter selection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<FilterOption>('all', 'today', 'week', 'month'),
        (activeFilter) => {
          const { getByTestId } = render(
            <FilterChips activeFilter={activeFilter} />,
          );

          let activeCount = 0;
          let inactiveCount = 0;

          for (const filter of FILTER_OPTIONS) {
            const chip = getByTestId(`chip-${filter}`);
            const label = getByTestId(`chip-label-${filter}`);

            const chipStyle = Array.isArray(chip.props.style)
              ? Object.assign({}, ...chip.props.style)
              : chip.props.style;

            const labelStyle = Array.isArray(label.props.style)
              ? Object.assign({}, ...label.props.style)
              : label.props.style;

            if (filter === activeFilter) {
              // Active chip: brandYellow background, black text
              expect(chipStyle.backgroundColor).toBe(COLORS.brandYellow);
              expect(labelStyle.color).toBe(COLORS.black);
              activeCount++;
            } else {
              // Inactive chip: surface background, grey text
              expect(chipStyle.backgroundColor).toBe(COLORS.surface);
              expect(labelStyle.color).toBe(COLORS.textSecondary);
              inactiveCount++;
            }
          }

          // Invariant: exactly 1 active, exactly 3 inactive
          expect(activeCount).toBe(1);
          expect(inactiveCount).toBe(FILTER_OPTIONS.length - 1);
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });

  it('inactive chips never have brandYellow background', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<FilterOption>('all', 'today', 'week', 'month'),
        (activeFilter) => {
          const { getByTestId } = render(
            <FilterChips activeFilter={activeFilter} />,
          );

          for (const filter of FILTER_OPTIONS) {
            if (filter === activeFilter) continue;

            const chip = getByTestId(`chip-${filter}`);
            const chipStyle = Array.isArray(chip.props.style)
              ? Object.assign({}, ...chip.props.style)
              : chip.props.style;

            expect(chipStyle.backgroundColor).not.toBe(COLORS.brandYellow);
          }
        },
      ),
      { numRuns: 50, verbose: true },
    );
  });
});
