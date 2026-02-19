/**
 * Color utilities for product color management
 * Handles hex color validation and normalization
 */

/**
 * Validates if a string is a valid hex color code
 * Accepts formats: #RGB, #RRGGBB, RGB, RRGGBB
 */
export function isValidHexColor(color: string): boolean {
  if (!color) return false;
  
  const hex = color.trim();
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  return hexRegex.test(hex);
}

/**
 * Normalizes a hex color to uppercase #RRGGBB format
 * Converts 3-digit hex to 6-digit
 */
export function normalizeHexColor(color: string): string | null {
  if (!color) return null;
  
  let hex = color.trim();
  
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  
  if (!/^[A-Fa-f0-9]{3}$|^[A-Fa-f0-9]{6}$/.test(hex)) {
    return null;
  }
  
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  return `#${hex.toUpperCase()}`;
}

/**
 * Gets a fallback color for products without colors
 */
export function getDefaultColor(): string {
  return '#CCCCCC';
}

/**
 * Pre-defined color palette for quick selection
 */
export const COLOR_PALETTE = [
  { name: 'Negro', hex: '#000000' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Rojo', hex: '#FF0000' },
  { name: 'Azul', hex: '#0000FF' },
  { name: 'Verde', hex: '#00FF00' },
  { name: 'Amarillo', hex: '#FFFF00' },
  { name: 'Rosa', hex: '#FF69B4' },
  { name: 'Naranja', hex: '#FF8C00' },
  { name: 'Morado', hex: '#800080' },
  { name: 'Marrón', hex: '#8B4513' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Turquesa', hex: '#40E0D0' },
  { name: 'Dorado', hex: '#FFD700' },
  { name: 'Plateado', hex: '#C0C0C0' },
  { name: 'Bordo', hex: '#800020' },
] as const;
