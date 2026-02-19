'use client';

import { useState } from 'react';
import { X, Palette } from 'lucide-react';
import { COLOR_PALETTE, normalizeHexColor } from '@/utils/color-utils';

interface ColorPickerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  required?: boolean;
  maxColors?: number;
}

export function ColorPicker({ 
  colors, 
  onChange, 
  required = true,
  maxColors = 10 
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState('#000000');
  const [showPalette, setShowPalette] = useState(false);

  const addColor = (hexColor: string) => {
    const normalized = normalizeHexColor(hexColor);
    
    if (!normalized) {
      alert('Color inválido. Use formato hex (#RRGGBB o #RGB)');
      return;
    }

    if (colors.includes(normalized)) {
      alert('Este color ya está agregado');
      return;
    }

    if (colors.length >= maxColors) {
      alert(`Máximo ${maxColors} colores permitidos`);
      return;
    }

    onChange([...colors, normalized]);
  };

  const removeColor = (hexColor: string) => {
    if (required && colors.length === 1) {
      alert('Debe tener al menos un color');
      return;
    }
    
    onChange(colors.filter(c => c !== hexColor));
  };

  const handleCustomColorAdd = () => {
    addColor(customColor);
  };

  const handlePaletteColorClick = (hexColor: string) => {
    addColor(hexColor);
    setShowPalette(false);
  };

  return (
    <div className="space-y-4">
      {/* Color Picker Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Selector de Color {required && '*'}
        </label>
        
        <div className="flex gap-2">
          {/* HTML5 Color Picker */}
          <div className="relative">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-10 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
              aria-label="Selector de color"
            />
          </div>

          {/* Hex Input */}
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            placeholder="#000000"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono uppercase"
            maxLength={7}
          />

          {/* Add Button */}
          <button
            type="button"
            onClick={handleCustomColorAdd}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 whitespace-nowrap"
          >
            Agregar
          </button>

          {/* Palette Button */}
          <button
            type="button"
            onClick={() => setShowPalette(!showPalette)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Paleta de colores"
          >
            <Palette className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Use el selector o ingrese un código hex. Mínimo {required ? 1 : 0} color{required ? '' : 'es'}, máximo {maxColors} colores.
        </p>
      </div>

      {/* Color Palette */}
      {showPalette && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Paleta Predefinida
          </h4>
          <div className="grid grid-cols-8 gap-2">
            {COLOR_PALETTE.map((color, colorIdx) => (
              <button
                key={`${color.hex}-${colorIdx}`}
                type="button"
                onClick={() => handlePaletteColorClick(color.hex)}
                className="group relative aspect-square rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-primary hover:scale-110 transition-all"
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (${color.hex})`}
                aria-label={`Agregar color ${color.name}`}
              >
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg text-white text-xs font-medium transition-opacity">
                  +
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Colors Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Colores Seleccionados ({colors.length}/{maxColors})
        </label>
        
        {colors.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            No hay colores seleccionados
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => (
              <div
                key={color}
                className="group relative inline-flex items-center gap-2 pl-3 pr-2 py-2 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Color Swatch */}
                <div
                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-500 shadow-inner"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                
                {/* Hex Code */}
                <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                  {color}
                </span>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="ml-1 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  aria-label={`Eliminar color ${color}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
