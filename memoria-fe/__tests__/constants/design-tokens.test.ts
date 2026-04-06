import { COLORS } from '../../src/constants/colors';
import { TYPOGRAPHY } from '../../src/constants/typography';
import { BORDER_RADIUS } from '../../src/constants/shadows';

describe('Design Tokens', () => {
  describe('COLORS', () => {
    it('contains the correct background hex value', () => {
      expect(COLORS.background).toBe('#09090B');
    });

    it('contains the correct brandYellow hex value', () => {
      expect(COLORS.brandYellow).toBe('#FFE600');
    });

    it('contains the correct textPrimary (white) hex value', () => {
      expect(COLORS.textPrimary).toBe('#FFFFFF');
    });

    it('contains the correct textSecondary hex value', () => {
      expect(COLORS.textSecondary).toBe('#A1A1AA');
    });

    it('contains the correct inputPlaceholder hex value', () => {
      expect(COLORS.inputPlaceholder).toBe('#52525B');
    });

    it('contains the correct error hex value', () => {
      expect(COLORS.error).toBe('#EF4444');
    });
  });

  describe('TYPOGRAPHY', () => {
    it('includes inputLarge entry', () => {
      expect(TYPOGRAPHY.inputLarge).toBeDefined();
    });

    it('inputLarge has correct fontSize', () => {
      expect(TYPOGRAPHY.inputLarge.fontSize).toBe(32);
    });

    it('includes authHeader entry', () => {
      expect(TYPOGRAPHY.authHeader).toBeDefined();
    });

    it('authHeader has correct fontSize and fontWeight', () => {
      expect(TYPOGRAPHY.authHeader.fontSize).toBe(24);
      expect(TYPOGRAPHY.authHeader.fontWeight).toBe('700');
    });
  });

  describe('BORDER_RADIUS', () => {
    it('includes 16 for buttons (lg)', () => {
      expect(BORDER_RADIUS.lg).toBe(16);
    });

    it('includes 32 for bottom sheets (xxl)', () => {
      expect(BORDER_RADIUS.xxl).toBe(32);
    });

    it('includes 8 for grid items (sm)', () => {
      expect(BORDER_RADIUS.sm).toBe(8);
    });

    it('includes 9999 for circular elements (full)', () => {
      expect(BORDER_RADIUS.full).toBe(9999);
    });
  });
});
