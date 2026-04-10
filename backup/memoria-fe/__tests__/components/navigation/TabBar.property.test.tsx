/**
 * Property-based tests for tab bar coloring
 *
 * Feature: ui-design-revamp
 * Property 3: Tab bar active/inactive coloring consistency
 * Validates: Requirements 7.3
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import { TabButton } from '../../../src/components/navigation/TabButton';
import { COLORS } from '../../../src/constants/colors';

// The 5 tab routes in order (matching TAB_CONFIGS in TabButton)
const TAB_ROUTES = [
  { key: 'index', name: 'index' },
  { key: 'circles', name: 'circles' },
  { key: 'upload', name: 'upload' },
  { key: 'threads', name: 'threads' },
  { key: 'settings', name: 'settings' },
] as const;

// Non-upload tab indices — these have visible labels with yellow/grey coloring
const NON_UPLOAD_INDICES = [0, 1, 3, 4] as const;

// ─── Property 3: Tab bar active/inactive coloring consistency ─────────────────
// Validates: Requirements 7.3

describe('Property 3: Tab bar active/inactive coloring consistency', () => {
  /**
   * For any active tab index (0-4), the label of the active non-upload tab
   * uses COLORS.brandYellow (#FFE600) and all other non-upload tab labels
   * use COLORS.textSecondary (#A1A1AA).
   *
   * The upload tab (index 2) has a special circular button style with no
   * standard label, so it is excluded from the yellow/grey label invariant.
   */
  it('TabButton label is yellow for active tab, grey for all others', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), (activeIndex) => {
        for (const tabIndex of NON_UPLOAD_INDICES) {
          const route = TAB_ROUTES[tabIndex];
          const isActive = tabIndex === activeIndex;

          const { getByTestId } = render(
            <TabButton
              route={route}
              index={tabIndex}
              isActive={isActive}
              onPress={() => {}}
            />,
          );

          const label = getByTestId(`tab-label-${route.name}`);
          const flatStyle = Array.isArray(label.props.style)
            ? Object.assign({}, ...label.props.style)
            : label.props.style;

          const expectedColor = isActive ? COLORS.brandYellow : COLORS.textSecondary;
          expect(flatStyle.color).toBe(expectedColor);
        }
      }),
      { numRuns: 50, verbose: true },
    );
  });

  /**
   * Invariant: across all non-upload tabs for any given activeIndex,
   * exactly one label is yellow when the active tab is non-upload,
   * and zero labels are yellow when the upload tab (index 2) is active.
   */
  it('exactly one non-upload tab label is yellow for any active index', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 4 }), (activeIndex) => {
        let yellowCount = 0;
        let greyCount = 0;

        for (const tabIndex of NON_UPLOAD_INDICES) {
          const route = TAB_ROUTES[tabIndex];
          const isActive = tabIndex === activeIndex;

          const { getByTestId } = render(
            <TabButton
              route={route}
              index={tabIndex}
              isActive={isActive}
              onPress={() => {}}
            />,
          );

          const label = getByTestId(`tab-label-${route.name}`);
          const flatStyle = Array.isArray(label.props.style)
            ? Object.assign({}, ...label.props.style)
            : label.props.style;

          if (flatStyle.color === COLORS.brandYellow) yellowCount++;
          else if (flatStyle.color === COLORS.textSecondary) greyCount++;
        }

        // Upload tab active (index 2) → 0 yellow, 4 grey among non-upload tabs
        // Any other tab active → 1 yellow, 3 grey among non-upload tabs
        const activeIsNonUpload = (NON_UPLOAD_INDICES as readonly number[]).includes(activeIndex);
        expect(yellowCount).toBe(activeIsNonUpload ? 1 : 0);
        expect(greyCount).toBe(activeIsNonUpload ? 3 : 4);
      }),
      { numRuns: 50, verbose: true },
    );
  });
});
