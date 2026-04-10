import { useAppTheme } from './ThemeContext';

/** @deprecated Use `useAppTheme` from `ThemeContext` (requires `ThemeProvider`). */
export function useThemeColors() {
  return useAppTheme();
}
