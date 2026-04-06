/**
 * Spacing System
 * 
 * Base Unit: 4px
 * All spacing values are multiples of 4px for consistent rhythm
 */

export const SPACING = {
  xs: 4,    // 4px - Icon padding, tight spacing
  sm: 8,    // 8px - Component internal padding
  md: 16,   // 16px - Default spacing, card padding
  lg: 24,   // 24px - Section spacing
  xl: 32,   // 32px - Large section spacing
  xxl: 48,  // 48px - Page margins
  xxxl: 64, // 64px - Hero sections

  // Auth-specific
  authBreathingRoom: 120, // KeyboardAvoidingView offset for auth screens
  buttonHeight: 56,       // Standard button height (auth + CTA buttons)
} as const;

/**
 * Usage:
 * - xs (4px): Icon padding, tight spacing
 * - sm (8px): Component internal padding
 * - md (16px): Default spacing, card padding
 * - lg (24px): Section spacing
 * - xl (32px): Large section spacing
 * - xxl (48px): Page margins
 * - xxxl (64px): Hero sections
 */
