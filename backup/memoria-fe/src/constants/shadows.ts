/**
 * Shadows & Elevation
 * 
 * Dark-appropriate shadows with increased opacity for visibility on dark backgrounds
 */

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 1, // Android
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3, // Android
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 5, // Android
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8, // Android
  },
  
  // Tab Bar specific shadow
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android
  },
} as const;

/**
 * Border Radius
 * 
 * Dark Theme: Consistent rounded corners
 */
export const BORDER_RADIUS = {
  sm: 8,      // Grid items, small elements
  md: 12,     // Cards, inputs
  lg: 16,     // Buttons
  xl: 24,     // Hero cards, featured content
  xxl: 32,    // Bottom sheets
  full: 9999, // Circular (avatars, pills)
} as const;
