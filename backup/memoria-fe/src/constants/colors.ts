/**
 * Memoria Design Tokens
 *
 * Source: your palette spec (Core Palette + Dark Mode Primaries).
 * We keep `COLORS` for backward compatibility, and add theme-aware helpers.
 */

export const PALETTE = {
  // Light primaries
  sunsetOrange: '#FF8C42',
  softPeach: '#FFC6A0',
  creamWhite: '#FFF8F3',
  pureWhite: '#FFFFFF',

  // Dark primaries
  darkBackground: '#1A1512',
  darkSurface: '#2D2424',
  darkOrangePrimary: '#E67A38',
  darkOrangeSecondary: '#EBAD8A',
} as const;

export type ThemeMode = 'system' | 'light' | 'dark';
export type ThemeScheme = 'light' | 'dark';

const LIGHT_COLORS = {
  // Core
  background: PALETTE.creamWhite,
  surface: PALETTE.pureWhite,
  surfaceLight: '#F6EFEA',

  // Brand
  brandPrimary: PALETTE.sunsetOrange,
  brandSecondary: PALETTE.softPeach,

  // Text
  textPrimary: '#1A1512',
  textSecondary: '#4A3F3A',
  textTertiary: '#6B5E58',
  placeholder: '#8A7B74',
  inputPlaceholder: '#8A7B74',

  // Semantic
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#2563EB',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Overlay
  overlayDark: 'rgba(0, 0, 0, 0.35)',
  overlayMedium: 'rgba(0, 0, 0, 0.20)',
  overlayLight: 'rgba(0, 0, 0, 0.12)',

  // Border
  border: '#E6D9D2',
  borderLight: '#F1E7E1',
} as const;

const DARK_COLORS = {
  // Core
  background: PALETTE.darkBackground,
  surface: PALETTE.darkSurface,
  surfaceLight: '#3A2F2F',

  // Brand
  brandPrimary: PALETTE.darkOrangePrimary,
  brandSecondary: PALETTE.darkOrangeSecondary,

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#D4C7C1',
  textTertiary: '#A89992',
  placeholder: '#7A6B65',
  inputPlaceholder: '#7A6B65',

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Overlay
  overlayDark: 'rgba(0, 0, 0, 0.80)',
  overlayMedium: 'rgba(0, 0, 0, 0.50)',
  overlayLight: 'rgba(0, 0, 0, 0.30)',

  // Border
  border: '#3A2F2F',
  borderLight: '#4A3D3D',
} as const;

export type ThemeColors = typeof LIGHT_COLORS;

export function getThemeColors(mode: ThemeMode, systemScheme: ThemeScheme): ThemeColors {
  const scheme: ThemeScheme = mode === 'system' ? systemScheme : mode;
  return (scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS) as ThemeColors;
}

// Backward-compatible constant: default to dark tokens.
export const COLORS = {
  ...DARK_COLORS,

  // Legacy brand naming used throughout the UI
  brandYellow: DARK_COLORS.brandPrimary,
  brandYellowDark: DARK_COLORS.brandSecondary,

  // Backward-compatible aliases (old Chromatic Relief names)
  sanctuaryLavender: DARK_COLORS.brandPrimary,
  sanctuaryLavenderLight: DARK_COLORS.brandPrimary,
  sanctuaryLavenderDark: DARK_COLORS.brandSecondary,
  memoriaSlate: DARK_COLORS.textPrimary,
  memoriaSlateLight: DARK_COLORS.textSecondary,
  memoriaSlateDark: DARK_COLORS.background,
  calmCloud: DARK_COLORS.background,
  calmCloudLight: DARK_COLORS.surface,
  calmCloudDark: DARK_COLORS.surfaceLight,
  gray100: DARK_COLORS.surface,
  gray200: DARK_COLORS.surfaceLight,
  gray300: DARK_COLORS.borderLight,
  gray400: DARK_COLORS.placeholder,
  gray500: DARK_COLORS.textTertiary,
  gray600: DARK_COLORS.textSecondary,
  gray700: '#D4D4D8',
  gray800: '#E4E4E7',
  gray900: '#F4F4F5',
} as const;
