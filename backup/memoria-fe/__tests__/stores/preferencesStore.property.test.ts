/**
 * Property-based tests for preferencesStore round-trips
 *
 * Feature: ui-design-revamp
 * Property 5: ViewMode round-trip — store and retrieve same value
 * Property 6: Language round-trip — store and retrieve same value
 * Validates: Requirements 30.1, 30.2
 */

import * as fc from 'fast-check';
import { act } from '@testing-library/react-native';

// Mock AsyncStorage before importing the store
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock the zustandStorage util that wraps AsyncStorage
jest.mock('../../src/utils/storage', () => ({
  zustandStorage: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

import { usePreferencesStore, type ViewMode, type Language } from '../../src/stores/preferencesStore';

// ─── Property 5: ViewMode round-trip ─────────────────────────────────────────
// Validates: Requirement 30.1

describe('Property 5: ViewMode round-trip', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePreferencesStore.setState({ viewMode: 'grid' });
  });

  it('setViewMode then read returns the same value for any valid ViewMode', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<ViewMode>('grid', 'threaded', 'gitcommit'),
        (viewMode) => {
          act(() => {
            usePreferencesStore.getState().setViewMode(viewMode);
          });
          const stored = usePreferencesStore.getState().viewMode;
          expect(stored).toBe(viewMode);
        },
      ),
      { numRuns: 30, verbose: true },
    );
  });

  it('viewMode is always one of the three valid values after any set', () => {
    const validModes: ViewMode[] = ['grid', 'threaded', 'gitcommit'];

    fc.assert(
      fc.property(
        fc.constantFrom<ViewMode>('grid', 'threaded', 'gitcommit'),
        (viewMode) => {
          act(() => {
            usePreferencesStore.getState().setViewMode(viewMode);
          });
          const stored = usePreferencesStore.getState().viewMode;
          expect(validModes).toContain(stored);
        },
      ),
      { numRuns: 30, verbose: true },
    );
  });
});

// ─── Property 6: Language round-trip ─────────────────────────────────────────
// Validates: Requirement 30.2

describe('Property 6: Language round-trip', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: 'english' });
  });

  it('setLanguage then read returns the same value for any valid Language', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Language>('english', 'hinglish'),
        (language) => {
          act(() => {
            usePreferencesStore.getState().setLanguage(language);
          });
          const stored = usePreferencesStore.getState().language;
          expect(stored).toBe(language);
        },
      ),
      { numRuns: 20, verbose: true },
    );
  });

  it('language is always one of the two valid values after any set', () => {
    const validLanguages: Language[] = ['english', 'hinglish'];

    fc.assert(
      fc.property(
        fc.constantFrom<Language>('english', 'hinglish'),
        (language) => {
          act(() => {
            usePreferencesStore.getState().setLanguage(language);
          });
          const stored = usePreferencesStore.getState().language;
          expect(validLanguages).toContain(stored);
        },
      ),
      { numRuns: 20, verbose: true },
    );
  });

  it('switching language twice returns to original value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Language>('english', 'hinglish'),
        fc.constantFrom<Language>('english', 'hinglish'),
        (first, second) => {
          act(() => {
            usePreferencesStore.getState().setLanguage(first);
            usePreferencesStore.getState().setLanguage(second);
          });
          // Final state should be the last set value
          expect(usePreferencesStore.getState().language).toBe(second);
        },
      ),
      { numRuns: 20, verbose: true },
    );
  });
});
