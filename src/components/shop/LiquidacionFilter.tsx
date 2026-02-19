'use client';

import React from 'react';
import { X, Flame } from 'lucide-react';
import { useFilterStore } from '@/store/filterStore';
import { TipoCalzado } from '@/types';

interface LiquidacionFilterProps {
  productCount: number;
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

const DESCUENTOS = [
  { label: '10% - 25%', min: 10, max: 25 },
  { label: '25% - 50%', min: 25, max: 50 },
  { label: '50% - 75%', min: 50, max: 75 },
  { label: 'Más del 75%', min: 75, max: 100 },
];

const LiquidacionFilter: React.FC<LiquidacionFilterProps> = ({ productCount }) => {
  const {
    talle,
    tipoCalzado,
    rangoPrecio,
    search,
    sort,
    setTalles,
    setTipoCalzado,
    setRangoPrecio,
    setSearch,
    setSort,
    resetFilters,
  } = useFilterStore();

  const [descuentoSeleccionado, setDescuentoSeleccionado] = React.useState<{ min: number; max: number } | null>(null);

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

  const handleDescuentoChange = (descuento: { min: number; max: number } | null) => {
    setDescuentoSeleccionado(descuento);
  };

  const hasActiveFilters = () => {
    return (
      (talle && talle.length > 0) ||
      (tipoCalzado && tipoCalzado.length > 0) ||
      rangoPrecio.min !== 0 ||
      rangoPrecio.max !== 300000 ||
      (search && search.trim().length > 0) ||
      descuentoSeleccionado !== null
    );
  };

  const handleResetFilters = () => {
    resetFilters();
    setDescuentoSeleccionado(null);
  };

  return (
    <div className="sticky top-24 bg-white rounded-xl shadow-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-error/10 hover:bg-error/20 transition-colors">
            <Flame size={20} className="text-error" />
          </div>
          <h3 className="font-semibold text-dark">Filtros de Liquidación</h3>
        </div>
        {hasActiveFilters() && (
          <button
            onClick={handleResetFilters}
            className="text-sm text-error hover:underline flex items-center gap-1"
          >
            <X size={16} />
            Limpiar
          </button>
        )}
      </div>

      {/* Contador de productos */}
      <div className="bg-error/10 p-3 rounded-lg border border-error/30">
        <p className="text-sm text-center">
          <span className="font-bold text-error">{productCount}</span> productos en liquidación
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-error"
        />
      </div>

      <hr />

      {/* Filtro por Descuento */}
      <div>
        <h4 className="font-medium text-dark mb-3 flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-error/10 hover:bg-error/20 transition-colors">
            <Flame size={18} className="text-error" />
          </div>
          Descuento
        </h4>
        <div className="space-y-2">
          {DESCUENTOS.map((desc) => (
            <label key={desc.label} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="descuento"
                checked={descuentoSeleccionado?.min === desc.min && descuentoSeleccionado?.max === desc.max}
                onChange={() => handleDescuentoChange(desc)}
                className="w-4 h-4 text-error border-gray-300 focus:ring-error accent-error"
              />
              <span className="text-sm group-hover:text-error transition-colors">
                {desc.label}
              </span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="descuento"
              checked={descuentoSeleccionado === null}
              onChange={() => handleDescuentoChange(null)}
              className="w-4 h-4 text-error border-gray-300 focus:ring-error accent-error"
            />
            <span className="text-sm group-hover:text-error transition-colors">
              Todos los descuentos
            </span>
          </label>
        </div>
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
                  ? 'border-error bg-error text-white'
                  : 'border-gray-300 hover:border-error'
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
                className="w-4 h-4 text-error border-gray-300 rounded focus:ring-error accent-error"
              />
              <span className="text-sm group-hover:text-error transition-colors">
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
            <span className="font-medium">${rangoPrecio.min.toLocaleString()}</span>
            <span className="text-gray">-</span>
            <span className="font-medium">${rangoPrecio.max.toLocaleString()}</span>
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="300000"
              step="10000"
              value={rangoPrecio.max}
              onChange={(e) => setRangoPrecio(rangoPrecio.min, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-error"
            />
          </div>
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-error"
        >
          <option value="newest">Más nuevos</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </div>
    </div>
  );
};

export default LiquidacionFilter;
