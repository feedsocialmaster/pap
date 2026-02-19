'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Store, Filter, X, LayoutGrid, List } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';
import ProductCardList from '@/components/shop/ProductCardList';
import ProductFilter from '@/components/shop/ProductFilter';
import { useFilterStore } from '@/store/filterStore';
import axios from '@/lib/axios';
import { Producto, PaginatedResponse, TipoCalzado } from '@/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { normalizeProductImages } from '@/utils/format';

type ApiProduct = Omit<Producto, 'imagenes'> & { imagenes: Array<string | { url: string }> };

export default function TiendaClient({
  initialProductos,
  initialTotal,
  initialTotalPages,
  initialPage,
  initialPageSize,
}: {
  initialProductos: Producto[];
  initialTotal: number;
  initialTotalPages: number;
  initialPage: number;
  initialPageSize: number;
}) {
  const filters = useFilterStore();
  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [total, setTotal] = useState<number>(initialTotal);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hydratedFromURL = useRef(false);
  const skipFirstLoad = useRef(true);

  // Initialize filters from URL once
  useEffect(() => {
    if (hydratedFromURL.current) return;
    const tp = searchParams.get('tipoCalzado');
    const talle = searchParams.get('talle');
    const min = searchParams.get('minPrice');
    const max = searchParams.get('maxPrice');
    const liq = searchParams.get('enLiquidacion');
    const q = searchParams.get('search');
    const stockMin = searchParams.get('stockMin');
    const stockMax = searchParams.get('stockMax');
    const sort = searchParams.get('sort');
    const p = searchParams.get('page');
    const ps = searchParams.get('pageSize');
    const view = searchParams.get('view');

    if (tp) {
      const allowed = ['Zapatillas', 'Sandalias', 'Botas', 'Stilettos', 'Chatitas', 'Plataformas'] as const;
      const tipos = tp
        .split(',')
        .filter(Boolean)
        .filter((v): v is (typeof allowed)[number] => (allowed as readonly string[]).includes(v));
      if (tipos.length > 0) filters.setTipoCalzado(tipos as unknown as TipoCalzado[]);
    }
    if (talle) {
      const talles = talle.split(',').map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
      if (talles.length > 0) filters.setTalles(talles);
    }
    
    // Solo establecer rango de precio si es diferente del valor por defecto
    const minPrice = min ? Number(min) : 0;
    const maxPrice = max ? Number(max) : 300000;
    if (minPrice !== 0 || maxPrice !== 300000) {
      filters.setRangoPrecio(minPrice, maxPrice);
    }
    
    // Solo establecer rango de stock si es diferente del valor por defecto
    const minStock = stockMin ? Number(stockMin) : 0;
    const maxStock = stockMax ? Number(stockMax) : 9999;
    if (minStock !== 0 || maxStock !== 9999) {
      filters.setStockRange(minStock, maxStock);
    }
    
    if (q != null && q.length > 0) filters.setSearch(q);
    
    // Solo establecer sort si es diferente del valor por defecto
    if (sort === 'price_asc' || sort === 'price_desc') {
      filters.setSort(sort);
    }
    
    if (liq != null) {
      const want = ['1', 'true', 'yes'].includes(liq.toLowerCase());
      if (want) filters.toggleEnLiquidacion();
    }
    if (p) setPage(parseInt(p, 10) || 1);
    if (ps) setPageSize(parseInt(ps, 10) || 10);
    if (view === 'list') setViewMode('list');
    hydratedFromURL.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      if (skipFirstLoad.current) {
        skipFirstLoad.current = false;
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (filters.tipoCalzado && filters.tipoCalzado.length > 0) {
          params.set('tipoCalzado', filters.tipoCalzado.join(','));
        }
        if (filters.talle && filters.talle.length > 0) {
          params.set('talle', filters.talle.join(','));
        }
        if (filters.rangoPrecio && (filters.rangoPrecio.min !== 0 || filters.rangoPrecio.max !== 300000)) {
          params.set('minPrice', String(filters.rangoPrecio.min));
          params.set('maxPrice', String(filters.rangoPrecio.max));
        }
        if (filters.stockRange && (filters.stockRange.min !== 0 || filters.stockRange.max !== 9999)) {
          params.set('stockMin', String(filters.stockRange.min));
          params.set('stockMax', String(filters.stockRange.max));
        }
        if (filters.search && filters.search.trim().length > 0) {
          params.set('search', filters.search.trim());
        }
        if (filters.enLiquidacion) {
          params.set('enLiquidacion', 'true');
        }
        if (filters.sort) {
          params.set('sort', filters.sort);
        }
        const res = await axios.get<PaginatedResponse<ApiProduct>>(`/products?${params.toString()}`);
        const raw = res.data?.data || [];
        const normalized: Producto[] = raw.map((p) => ({
          ...p,
          imagenes: normalizeProductImages(p.imagenes),
        }));
        setProductos(normalized);
        setTotal(res.data?.total ?? normalized.length);
        setTotalPages(res.data?.totalPages ?? 1);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        // En caso de error, mantener los productos iniciales
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters, page, pageSize]);

  // Sync filters to URL for shareable views
  useEffect(() => {
    if (!hydratedFromURL.current) return;
    const params = new URLSearchParams();
    
    // Solo agregar parámetros si son diferentes de los valores por defecto
    if (page !== 1) params.set('page', String(page));
    if (pageSize !== 10) params.set('pageSize', String(pageSize));
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (filters.tipoCalzado && filters.tipoCalzado.length > 0) params.set('tipoCalzado', filters.tipoCalzado.join(','));
    if (filters.talle && filters.talle.length > 0) params.set('talle', filters.talle.join(','));
    
    // Solo agregar rango de precio si es diferente del valor por defecto
    if (filters.rangoPrecio && (filters.rangoPrecio.min !== 0 || filters.rangoPrecio.max !== 300000)) {
      params.set('minPrice', String(filters.rangoPrecio.min));
      params.set('maxPrice', String(filters.rangoPrecio.max));
    }
    
    // Solo agregar rango de stock si es diferente del valor por defecto
    if (filters.stockRange && (filters.stockRange.min !== 0 || filters.stockRange.max !== 9999)) {
      params.set('stockMin', String(filters.stockRange.min));
      params.set('stockMax', String(filters.stockRange.max));
    }
    
    if (filters.search && filters.search.trim().length > 0) {
      params.set('search', filters.search.trim());
    }
    if (filters.enLiquidacion) params.set('enLiquidacion', 'true');
    
    // Solo agregar sort si es diferente del valor por defecto
    if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
    
    // Si no hay parámetros, usar la URL limpia
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, page, pageSize, viewMode, pathname, router]);

  // Los productos ya vienen filtrados del servidor, no necesitamos filtrar localmente
  const productosFiltrados = productos;

  return (
    <main className="container-custom py-8">
      {/* Header */}
      <header className="mb-8 mt-8 text-center">
        <div className="flex flex-row items-center justify-center gap-3 mb-4 mt-24">
          <span className="flex items-center h-[40px] -mb-1" aria-hidden="true">
            <Store className="text-primary" size={36} />
          </span>
          <span className="flex flex-col justify-center h-[40px]">
            <h1 className="text-3xl font-bold text-dark relative top-2">Tienda Web</h1>
          </span>
        </div>
        <p className="text-gray text-center pb-8">
          Descubrí toda nuestra colección de calzado femenino
        </p>
      </header>

      {/* Botón Filtros - Solo móvil */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-dark font-medium hover:border-primary transition-colors"
        >
          <Filter size={20} />
          Filtros
        </button>
      </div>

      {/* Layout de 2 columnas */}
      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Columna Izquierda: Filtros (sticky) - Solo desktop */}
        <aside className="hidden lg:block lg:col-span-1" aria-label="Filtros de productos">
          <ProductFilter productCount={total} />
        </aside>

        {/* Columna Derecha: Grilla de productos */}
        <section className="w-full lg:col-span-3" aria-label="Productos disponibles">
          {/* Controles superiores: Paginación y Vista */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray">
                Mostrando página {page} de {totalPages} ({total} productos)
              </div>
              
              {/* Botones de alternancia de vista */}
              <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label="Vista de cuadrícula"
                  title="Vista de cuadrícula"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label="Vista de lista"
                  title="Vista de lista"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            
            {/* Controles de paginación - Simplificados en móvil */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Botones principales */}
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className={`hidden md:inline-block px-3 py-2 rounded-lg border ${page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                aria-label="Primera página"
              >«</button>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-2 rounded-lg border ${page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                aria-label="Página anterior"
              >‹</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`px-3 py-2 rounded-lg border ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                aria-label="Página siguiente"
              >›</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className={`hidden md:inline-block px-3 py-2 rounded-lg border ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                aria-label="Última página"
              >»</button>
              
              {/* Input de página - Solo desktop */}
              <div className="hidden md:flex items-center gap-1 ml-1">
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, totalPages)}
                  value={page}
                  onChange={(e) => {
                    const v = parseInt(e.target.value || '1', 10);
                    if (!Number.isNaN(v)) setPage(Math.min(Math.max(1, v), Math.max(1, totalPages)));
                  }}
                  className="w-16 border rounded-lg px-2 py-2 text-center"
                  aria-label="Ir a página"
                />
              </div>
              
              {/* Selector de cantidad por página - Solo desktop */}
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
                className="hidden md:block ml-2 border rounded-lg px-2 py-2"
              >
                <option value={10}>10</option>
                <option value={24}>24</option>
                <option value={60}>60</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="text-center py-16 text-gray-500" role="status" aria-live="polite">Cargando productos...</div>
          )}
          {productosFiltrados.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6" role="list">
                {productosFiltrados.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4" role="list">
                {productosFiltrados.map((producto) => (
                  <ProductCardList key={producto.id} producto={producto} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <div className="w-32 h-32 mx-auto mb-6 bg-gray-light rounded-full flex items-center justify-center" aria-hidden="true">
                <Store size={64} className="text-gray" />
              </div>
              <h3 className="text-xl font-semibold text-dark mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray mb-6">
                Intentá ajustar los filtros para ver más resultados
              </p>
              <button
                onClick={() => filters.resetFilters()}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
                aria-label="Limpiar todos los filtros"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modal de Filtros - Solo móvil */}
      {isMobileFilterOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          {/* Modal deslizante desde abajo */}
          <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden animate-slide-up">
            <div className="bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col">
              {/* Header del modal - FIJO */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-2xl">
                <h2 className="text-lg font-semibold text-dark">Filtros</h2>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Cerrar filtros"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              
              {/* Contenido de filtros - SCROLLEABLE */}
              <div className="flex-1 overflow-y-auto p-4">
                <ProductFilter productCount={total} isMobile />
              </div>
              
              {/* Footer con botones de acción - FIJO */}
              <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
                <button
                  onClick={() => {
                    filters.resetFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-dark text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Ver {total} {total === 1 ? 'resultado' : 'resultados'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
