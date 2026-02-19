import { describe, it, expect } from 'vitest';
import {
  isValidHexColor,
  normalizeHexColor,
  validateAndNormalizeColors,
  getDefaultColor,
} from './color-utils.js';

describe('Color Utils', () => {
  describe('isValidHexColor', () => {
    it('should validate 6-digit hex colors with #', () => {
      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#00ff00')).toBe(true);
      expect(isValidHexColor('#ABCDEF')).toBe(true);
    });

    it('should validate 6-digit hex colors without #', () => {
      expect(isValidHexColor('FF0000')).toBe(true);
      expect(isValidHexColor('00ff00')).toBe(true);
      expect(isValidHexColor('ABCDEF')).toBe(true);
    });

    it('should validate 3-digit hex colors', () => {
      expect(isValidHexColor('#F00')).toBe(true);
      expect(isValidHexColor('0F0')).toBe(true);
      expect(isValidHexColor('#ABC')).toBe(true);
    });

    it('should reject invalid hex colors', () => {
      expect(isValidHexColor('#GG0000')).toBe(false);
      expect(isValidHexColor('notahex')).toBe(false);
      expect(isValidHexColor('#12')).toBe(false);
      expect(isValidHexColor('#1234567')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });
  });

  describe('normalizeHexColor', () => {
    it('should normalize 6-digit hex to uppercase with #', () => {
      expect(normalizeHexColor('#ff0000')).toBe('#FF0000');
      expect(normalizeHexColor('00ff00')).toBe('#00FF00');
      expect(normalizeHexColor('#ABCDEF')).toBe('#ABCDEF');
    });

    it('should expand 3-digit hex to 6-digit uppercase with #', () => {
      expect(normalizeHexColor('#F00')).toBe('#FF0000');
      expect(normalizeHexColor('0F0')).toBe('#00FF00');
      expect(normalizeHexColor('#ABC')).toBe('#AABBCC');
    });

    it('should return null for invalid colors', () => {
      expect(normalizeHexColor('notahex')).toBe(null);
      expect(normalizeHexColor('#GG0000')).toBe(null);
      expect(normalizeHexColor('')).toBe(null);
    });

    it('should handle colors with or without # prefix', () => {
      expect(normalizeHexColor('#FF0000')).toBe('#FF0000');
      expect(normalizeHexColor('FF0000')).toBe('#FF0000');
    });
  });

  describe('validateAndNormalizeColors', () => {
    it('should validate and normalize array of valid colors', () => {
      const colors = ['#FF0000', '00ff00', '#ABC'];
      const result = validateAndNormalizeColors(colors);
      expect(result).toEqual(['#FF0000', '#00FF00', '#AABBCC']);
    });

    it('should return null for empty array', () => {
      expect(validateAndNormalizeColors([])).toBe(null);
    });

    it('should return null if any color is invalid', () => {
      const colors = ['#FF0000', 'invalid', '#00FF00'];
      expect(validateAndNormalizeColors(colors)).toBe(null);
    });

    it('should return null for non-array input', () => {
      expect(validateAndNormalizeColors('not an array' as any)).toBe(null);
    });

    it('should return null for array with non-string elements', () => {
      const colors = ['#FF0000', 123, '#00FF00'] as any;
      expect(validateAndNormalizeColors(colors)).toBe(null);
    });
  });

  describe('getDefaultColor', () => {
    it('should return a valid default color', () => {
      const defaultColor = getDefaultColor();
      expect(defaultColor).toBe('#CCCCCC');
      expect(isValidHexColor(defaultColor)).toBe(true);
    });
  });
});
