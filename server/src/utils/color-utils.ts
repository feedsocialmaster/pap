/**
 * Color utilities for product color management
 * Handles hex color validation and normalization
 */

/**
 * Validates if a string is a valid hex color code
 * Accepts formats: #RGB, #RRGGBB, RGB, RRGGBB
 * @param color - Color string to validate
 * @returns true if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  if (!color) return false;
  
  const hex = color.trim();
  
  // Check for valid hex pattern with or without #
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  
  return hexRegex.test(hex);
}

/**
 * Normalizes a hex color to uppercase #RRGGBB format
 * Converts 3-digit hex to 6-digit
 * @param color - Color string to normalize
 * @returns Normalized hex color or null if invalid
 */
export function normalizeHexColor(color: string): string | null {
  if (!color) return null;
  
  let hex = color.trim();
  
  // Remove # if present
  if (hex.startsWith('#')) {
    hex = hex.substring(1);
  }
  
  // Validate format
  if (!/^[A-Fa-f0-9]{3}$|^[A-Fa-f0-9]{6}$/.test(hex)) {
    return null;
  }
  
  // Expand 3-digit to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Return uppercase with #
  return `#${hex.toUpperCase()}`;
}

/**
 * Validates and normalizes an array of hex colors
 * @param colors - Array of color strings
 * @returns Array of normalized hex colors or null if any invalid
 */
export function validateAndNormalizeColors(colors: string[]): string[] | null {
  if (!Array.isArray(colors)) return null;
  if (colors.length === 0) return null;
  
  const normalized: string[] = [];
  
  for (const color of colors) {
    if (typeof color !== 'string') return null;
    
    const normalizedColor = normalizeHexColor(color);
    if (!normalizedColor) return null;
    
    normalized.push(normalizedColor);
  }
  
  return normalized;
}

/**
 * Gets a fallback color for products without colors
 * @returns Default gray color
 */
export function getDefaultColor(): string {
  return '#CCCCCC';
}
