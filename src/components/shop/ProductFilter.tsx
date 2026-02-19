'use client';

import React from 'react';
import { Filter, X } from 'lucide-react';
import { useFilterStore } from '@/store/filterStore';
import { TipoCalzado } from '@/types';
import { formatNumber } from '@/utils/format';

interface ProductFilterProps {
  productCount: number;
  isMobile?: boolean;
}

const TALLES_DISPONIBLES = [35, 36, 37, 38, 39, 40, 41, 42];
const TIPOS_CALZADO: TipoCalzado[] = [
  'Zapatillas',
  'Sandalias',
  'Botas',
  'Stilettos',
  'Chatitas',
  'Plataformas',
];

const ProductFilter: React.FC<ProductFilterProps> = ({ productCount, isMobile = false }) => {
  const {
    talle,
    tipoCalzado,
    rangoPrecio,
    search,
    stockRange,
    sort,
    descuentoPuntos,
    codigoPromocional,
    enLiquidacion,
    setTalles,
    setTipoCalzado,
    setRangoPrecio,
    setSearch,
    setStockRange,
    setSort,
    toggleDescuentoPuntos,
    toggleCodigoPromocional,
    toggleEnLiquidacion,
    resetFilters,
  } = useFilterStore();

  const handleTalleChange = (talleValue: number) => {
    const newTalles = talle?.includes(talleValue)
      ? talle.filter((t) => t !== talleValue)
      : [...(talle || []), talleValue];
    setTalles(newTalles);
  };

  const handleTipoChange = (tipo: TipoCalzado) => {
    const newTipos = tipoCalzado?.includes(tipo)
      ? tipoCalzado.filter((t) => t !== tipo)
      : [...(tipoCalzado || []), tipo];
    setTipoCalzado(newTipos);
  };

  const hasActiveFilters = () => {
    return (
      (talle && talle.length > 0) ||
      (tipoCalzado && tipoCalzado.length > 0) ||
      rangoPrecio.min !== 0 ||
      rangoPrecio.max !== 300000 ||
      (search && search.trim().length > 0) ||
      (stockRange && (stockRange.min !== 0 || stockRange.max !== 9999)) ||
      descuentoPuntos ||
      codigoPromocional ||
      enLiquidacion
    );
  };

  return (
    <div className={isMobile ? "space-y-6" : "sticky top-24 bg-white rounded-xl shadow-card p-6 space-y-6"}>
      {/* Header - Solo en desktop */}
      {!isMobile && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-primary" />
            <h3 className="font-semibold text-dark">Filtros</h3>
          </div>
          {hasActiveFilters() && (
            <button
              onClick={resetFilters}
              className="text-sm text-error hover:underline flex items-center gap-1"
            >
              <X size={16} />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Contador de productos */}
      <div className="bg-gray-light p-3 rounded-lg">
        <p className="text-sm text-center">
          <span className="font-bold text-primary">{productCount}</span> productos encontrados
        </p>
      </div>

      <hr />

      {/* Búsqueda por nombre */}
      <div>
        <h4 className="font-medium text-dark mb-3">Buscar</h4>
        <input
          type="text"
          value={search || ''}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nombre del producto"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <hr />

      {/* Filtro por Talle */}
      <div>
        <h4 className="font-medium text-dark mb-3">Talle</h4>
        <div className="grid grid-cols-4 gap-2">
          {TALLES_DISPONIBLES.map((talleValue) => (
            <button
              key={talleValue}
              onClick={() => handleTalleChange(talleValue)}
              className={`py-2 px-3 rounded-lg border-2 transition-all text-sm font-medium ${
                talle?.includes(talleValue)
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 hover:border-primary'
              }`}
            >
              {talleValue}
            </button>
          ))}
        </div>
      </div>

      <hr />

      {/* Filtro por Tipo de Calzado */}
      <div>
        <h4 className="font-medium text-dark mb-3">Tipo de Calzado</h4>
        <div className="space-y-2">
          {TIPOS_CALZADO.map((tipo) => (
            <label key={tipo} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={tipoCalzado?.includes(tipo)}
                onChange={() => handleTipoChange(tipo)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
              />
              <span className="text-sm group-hover:text-primary transition-colors">
                {tipo}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr />

      {/* Filtro por Rango de Precio */}
      <div>
        <h4 className="font-medium text-dark mb-3">Rango de Precio</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">${formatNumber(rangoPrecio.min)}</span>
            <span className="text-gray">-</span>
            <span className="font-medium">${formatNumber(rangoPrecio.max)}</span>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="300000"
              step="10000"
              value={rangoPrecio.max}
              onChange={(e) => setRangoPrecio(rangoPrecio.min, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </div>

      <hr />

      {/* Rango de Stock */}
      <div>
        <h4 className="font-medium text-dark mb-3">Stock</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={stockRange?.min ?? 0}
            onChange={(e) => setStockRange(parseInt(e.target.value || '0', 10), stockRange?.max ?? 9999)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Mínimo"
          />
          <input
            type="number"
            min={0}
            value={stockRange?.max ?? 9999}
            onChange={(e) => setStockRange(stockRange?.min ?? 0, parseInt(e.target.value || '0', 10))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Máximo"
          />
        </div>
      </div>

      <hr />

      {/* Filtros Adicionales */}
      <div>
        <h4 className="font-medium text-dark mb-3">Ofertas y Descuentos</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={codigoPromocional}
              onChange={toggleCodigoPromocional}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
            />
            <span className="text-sm group-hover:text-primary transition-colors">
              🏷️ Con código promocional
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={enLiquidacion}
              onChange={toggleEnLiquidacion}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
            />
            <span className="text-sm group-hover:text-primary transition-colors">
              🔥 En liquidación
            </span>
          </label>
        </div>
      </div>

      <hr />

      {/* Ordenar por */}
      <div>
        <h4 className="font-medium text-dark mb-3">Ordenar por</h4>
        <select
          value={sort || 'newest'}
          onChange={(e) => {
            const v = e.target.value;
            const allowed = ['newest','price_asc','price_desc'] as const;
            if ((allowed as readonly string[]).includes(v)) {
              setSort(v as (typeof allowed)[number]);
            } else {
              setSort('newest');
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="newest">Más nuevos</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilter;
