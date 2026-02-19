'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Package } from 'lucide-react';

export interface ProductVariant {
  id?: string;
  colorName: string;
  colorCode: string;
  size: number;  // Talle
  stock: number;
  sku?: string;
}

interface ProductVariantsEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  availableColors?: string[]; // Códigos hex de colores disponibles
  availableSizes?: number[];  // Talles disponibles del producto
}

export function ProductVariantsEditor({
  variants,
  onChange,
  availableColors = [],
  availableSizes = [],
}: ProductVariantsEditorProps) {
  // Calcular stock total
  const stockTotal = variants.reduce((sum, v) => sum + v.stock, 0);

  // Obtener color name de un código hex (o usar los primeros caracteres del hex)
  const getColorName = (colorCode: string): string => {
    const existing = variants.find(v => v.colorCode === colorCode);
    return existing?.colorName || colorCode;
  };

  // Obtener stock para una combinación específica
  const getStock = (colorCode: string, size: number): number => {
    const variant = variants.find(v => v.colorCode === colorCode && v.size === size);
    return variant?.stock || 0;
  };

  // Obtener SKU para una combinación específica  
  const getSku = (colorCode: string, size: number): string => {
    const variant = variants.find(v => v.colorCode === colorCode && v.size === size);
    return variant?.sku || '';
  };

  // Actualizar stock para una combinación
  const updateStock = (colorCode: string, size: number, stock: number) => {
    const existingIndex = variants.findIndex(
      v => v.colorCode === colorCode && v.size === size
    );

    let colorName = getColorName(colorCode);
    
    if (existingIndex >= 0) {
      // Actualizar variante existente
      const updated = [...variants];
      updated[existingIndex] = {
        ...updated[existingIndex],
        stock,
      };
      onChange(updated);
    } else {
      // Crear nueva variante
      const newVariant = {
        colorName,
        colorCode,
        size,
        stock,
      };
      onChange([...variants, newVariant]);
    }
  };

  // Actualizar color name para todos los talles de un color
  const updateColorName = (colorCode: string, newName: string) => {
    const updated = variants.map(v => 
      v.colorCode === colorCode ? { ...v, colorName: newName } : v
    );
    onChange(updated);
  };

  // Actualizar SKU para una combinación específica
  const updateSku = (colorCode: string, size: number, sku: string) => {
    const existingIndex = variants.findIndex(
      v => v.colorCode === colorCode && v.size === size
    );

    if (existingIndex >= 0) {
      const updated = [...variants];
      updated[existingIndex] = {
        ...updated[existingIndex],
        sku,
      };
      onChange(updated);
    } else {
      // Crear nueva variante con SKU
      onChange([...variants, {
        colorName: getColorName(colorCode),
        colorCode,
        size,
        stock: 0,
        sku,
      }]);
    }
  };

  // Eliminar todas las variantes de un color
  const deleteColor = (colorCode: string) => {
    if (availableColors.length <= 1) {
      alert('Debe tener al menos un color disponible');
      return;
    }
    
    if (confirm('¿Eliminar todas las variantes de este color?')) {
      onChange(variants.filter(v => v.colorCode !== colorCode));
    }
  };

  // Generar automáticamente variantes para todas las combinaciones
  const generateAllVariants = () => {
    const newVariants: ProductVariant[] = [];
    
    availableColors.forEach(colorCode => {
      availableSizes.forEach(size => {
        const existing = variants.find(v => v.colorCode === colorCode && v.size === size);
        if (existing) {
          newVariants.push(existing);
        } else {
          newVariants.push({
            colorName: getColorName(colorCode) || `Color ${colorCode}`,
            colorCode,
            size,
            stock: 0,
          });
        }
      });
    });
    
    onChange(newVariants);
  };

  // Auto-generar variantes cuando cambien colores o talles
  useEffect(() => {
    if (availableColors.length > 0 && availableSizes.length > 0) {
      // Solo auto-generar si no hay variantes o si hay colores/talles sin variantes
      const hasAllCombinations = availableColors.every(color =>
        availableSizes.every(size =>
          variants.some(v => v.colorCode === color && v.size === size)
        )
      );
      
      if (!hasAllCombinations) {
        generateAllVariants();
      }
    }
  }, [availableColors.join(','), availableSizes.join(',')]);

  if (availableColors.length === 0 || availableSizes.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Configuración requerida
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Primero debes seleccionar al menos un color y un talle en las secciones superiores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con Stock Total */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stock por Color y Talle
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Gestiona el stock para cada combinación de color y talle
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400">Stock Total</p>
          <p className="text-3xl font-bold text-primary">{stockTotal}</p>
        </div>
      </div>

      {/* Tabla de Stock por Color y Talle */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                Color
              </th>
              {availableSizes.map(size => (
                <th
                  key={size}
                  className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                >
                  Talle {size}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                Total
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {availableColors.map((colorCode, colorIndex) => {
              const colorTotal = availableSizes.reduce(
                (sum, size) => sum + getStock(colorCode, size),
                0
              );

              return (
                <tr key={`${colorCode}-${colorIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {/* Celda de Color */}
                  <td className="px-4 py-3 border border-gray-300 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                        style={{ backgroundColor: colorCode }}
                        title={colorCode}
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={getColorName(colorCode)}
                          onChange={(e) => updateColorName(colorCode, e.target.value)}
                          placeholder="Nombre del color"
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                          {colorCode}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Celdas de Stock por Talle */}
                  {availableSizes.map(size => (
                    <td
                      key={`${colorCode}-${size}`}
                      className="px-2 py-3 border border-gray-300 dark:border-gray-600"
                    >
                      <input
                        type="number"
                        min="0"
                        value={getStock(colorCode, size)}
                        onChange={(e) =>
                          updateStock(colorCode, size, parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 text-center text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
                      />
                    </td>
                  ))}

                  {/* Total por Color */}
                  <td className="px-4 py-3 text-center font-semibold border border-gray-300 dark:border-gray-600">
                    {colorTotal}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-center border border-gray-300 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => deleteColor(colorCode)}
                      disabled={availableColors.length <= 1}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar color"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
              <td className="px-4 py-3 text-left border border-gray-300 dark:border-gray-600">
                Total por Talle
              </td>
              {availableSizes.map(size => {
                const sizeTotal = availableColors.reduce(
                  (sum, colorCode) => sum + getStock(colorCode, size),
                  0
                );
                return (
                  <td
                    key={`total-${size}`}
                    className="px-4 py-3 text-center border border-gray-300 dark:border-gray-600"
                  >
                    {sizeTotal}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center border border-gray-300 dark:border-gray-600 text-primary text-lg">
                {stockTotal}
              </td>
              <td className="border border-gray-300 dark:border-gray-600"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sección de SKUs (Opcional - Expandible) */}
      <details className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
          SKUs por Variante (Opcional)
        </summary>
        <div className="mt-4 space-y-2">
          {availableColors.map(colorCode => (
            <div key={`sku-${colorCode}`} className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border"
                  style={{ backgroundColor: colorCode }}
                />
                {getColorName(colorCode)}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-7">
                {availableSizes.map(size => (
                  <div key={`sku-${colorCode}-${size}`}>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      Talle {size}
                    </label>
                    <input
                      type="text"
                      value={getSku(colorCode, size)}
                      onChange={(e) => updateSku(colorCode, size, e.target.value)}
                      placeholder={`SKU-${size}`}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Mensaje Informativo */}
      {variants.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-3">
            <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Sin variantes de stock
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Configura el stock para cada combinación de color y talle.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
