import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  getThemeColors,
  type ThemeColors,
  type ThemeMode,
  type ThemeScheme,
} from '../constants/colors';
import { usePreferencesStore } from '../stores/preferencesStore';

/** Theme tokens + legacy names used across the app (`brandYellow`, etc.). */
export type AppTheme = ThemeColors & {
  brandYellow: string;
  brandYellowDark: string;
};

function toAppTheme(mode: ThemeMode, systemScheme: ThemeScheme): AppTheme {
  const c = getThemeColors(mode, systemScheme);
  return {
    ...c,
    brandYellow: c.brandPrimary,
    brandYellowDark: c.brandSecondary,
  };
}

function resolveScheme(
  themeMode: ThemeMode,
  systemScheme: ThemeScheme
): ThemeScheme {
  return themeMode === 'system' ? systemScheme : themeMode;
}

export interface ThemeContextValue {
  colors: AppTheme;
  /** Effective light/dark after applying system + user preference */
  resolvedScheme: ThemeScheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme: ThemeScheme =
    useColorScheme() === 'dark' ? 'dark' : 'light';
  const themeMode = usePreferencesStore((s) => s.themeMode);

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedScheme = resolveScheme(themeMode, systemScheme);
    return {
      colors: toAppTheme(themeMode, systemScheme),
      resolvedScheme,
    };
  }, [themeMode, systemScheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      colors: toAppTheme('dark', 'dark'),
      resolvedScheme: 'dark',
    };
  }
  return ctx;
}

/** Convenience: only color tokens (most common). */
export function useAppTheme(): AppTheme {
  return useTheme().colors;
}
