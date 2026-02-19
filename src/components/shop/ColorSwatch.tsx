/**
 * ColorSwatch Component
 * Displays product color swatches with accessibility support
 */

interface ColorSwatchProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function ColorSwatch({ 
  color, 
  size = 'md', 
  showTooltip = true,
  className = '' 
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-2 border-gray-300 shadow-sm ${className}`}
      style={{ backgroundColor: color }}
      title={showTooltip ? color : undefined}
      role="img"
      aria-label={`Color ${color}`}
    />
  );
}

interface ColorSwatchListProps {
  colors: string[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ColorSwatchList({ 
  colors, 
  maxVisible = 5, 
  size = 'sm',
  className = '' 
}: ColorSwatchListProps) {
  if (!colors || colors.length === 0) return null;

  const visibleColors = colors.slice(0, maxVisible);
  const remainingCount = colors.length - maxVisible;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {visibleColors.map((color, index) => (
        <ColorSwatch 
          key={`${color}-${index}`} 
          color={color} 
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500 ml-1">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
