'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, X } from 'lucide-react';
import axios from '@/lib/axios';
import { useDebounce } from '@/hooks/useDebounce';
import type { Producto } from '@/types';
import { formatPrice, getProductUrl } from '@/utils/format';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Producto[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setRecentSearches(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    setQuery('');
    setResults([]);
    setTotal(null);
    setLoading(false);
  }, [isOpen]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setTotal(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isCurrent = true;

    async function run() {
      setLoading(true);
      try {
        const response = await axios.get('/products', {
          params: {
            search: q,
            page: 1,
            pageSize: 100,
            stockMin: 1,
          },
          signal: controller.signal,
        });

        if (!isCurrent) return;
        setResults(Array.isArray(response.data?.data) ? response.data.data : []);
        setTotal(typeof response.data?.total === 'number' ? response.data.total : null);
      } catch (error: any) {
        if (!isCurrent) return;
        if (error?.code !== 'ERR_CANCELED' && error?.message !== 'canceled') {
          console.error('Error al buscar productos:', error);
        }
        setResults([]);
        setTotal(null);
      } finally {
        if (!isCurrent) return;
        setLoading(false);
      }
    }

    run();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [debouncedQuery]);

  const handleSearch = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (term.length < 2) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setQuery(term);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleProductClick = () => {
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  const q = query.trim();

  return (
    <div className="fixed inset-0 z-50">
      {/* Fondo difuminado */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Contenedor fullscreen */}
      <div className="relative h-full w-full bg-white/95">
        <div className="mx-auto h-full w-full max-w-4xl flex flex-col">
          {/* Search Input (sticky) */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-light sticky top-0 bg-white/95 backdrop-blur-sm">
            <Search className="text-gray" size={24} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q) handleSearch(q);
              }}
              placeholder="Buscar productos..."
              className="flex-1 text-lg outline-none bg-transparent"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-light rounded-lg transition-colors"
              aria-label="Cerrar búsqueda"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {q.length === 0 ? (
              <div className="p-6">
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-dark">Búsquedas recientes</h3>
                      <button
                        onClick={clearRecentSearches}
                        className="text-sm text-gray hover:text-primary"
                      >
                        Limpiar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, index) => (
                        <button
                          key={`${search}-${index}`}
                          onClick={() => handleSearch(search)}
                          className="px-4 py-2 bg-gray-light hover:bg-gray-300 rounded-full text-sm transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Búsquedas populares
                  </h3>
                  <div className="space-y-2">
                    {['Sandalias', 'Zapatillas', 'Botas', 'Stilettos', 'Liquidación'].map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="block w-full text-left px-4 py-3 hover:bg-gray-light rounded-lg transition-colors"
                      >
                        <Search className="inline mr-2 text-gray" size={16} />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="p-8">
                <p className="text-sm text-gray">Buscando productos…</p>
              </div>
            ) : results.length > 0 ? (
              <div className="p-4">
                <p className="text-sm text-gray mb-3 px-2">
                  {typeof total === 'number'
                    ? `Mostrando ${results.length} de ${total} resultado${total !== 1 ? 's' : ''} para "${q}"`
                    : `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${q}"`}
                </p>

                <div className="space-y-2">
                  {results.map((producto) => {
                    const primeraImagen = producto.imagenes?.[0];
                    const imagenUrl =
                      typeof primeraImagen === 'string'
                        ? primeraImagen
                        : primeraImagen?.url || '/placeholder-product.jpg';

                    return (
                      <Link
                        key={producto.id}
                        href={getProductUrl(producto)}
                        onClick={handleProductClick}
                        className="flex items-center gap-4 p-3 hover:bg-gray-light rounded-lg transition-colors"
                      >
                        <div className="w-16 h-16 bg-gray-light rounded overflow-hidden flex-shrink-0">
                          <img
                            src={imagenUrl}
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-dark truncate">{producto.nombre}</h4>
                          <p className="text-sm text-gray">{producto.tipoCalzado}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-primary">{formatPrice(producto.precio)}</span>
                            {producto.porcentajeDescuento && (
                              <span className="text-xs bg-error text-white px-2 py-0.5 rounded">
                                -{producto.porcentajeDescuento}%
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {typeof total === 'number' && total > results.length && (
                  <Link
                    href={`/tienda?search=${encodeURIComponent(q)}`}
                    onClick={handleProductClick}
                    className="block w-full text-center py-3 mt-4 text-primary hover:bg-primary/10 rounded-lg font-medium transition-colors"
                  >
                    Ver todos los resultados en la tienda
                  </Link>
                )}
              </div>
            ) : q.length >= 2 ? (
              <div className="p-12 text-center">
                <Search className="mx-auto text-gray mb-4" size={64} />
                <h3 className="text-xl font-bold text-dark mb-2">No encontramos resultados</h3>
                <p className="text-gray mb-6">Probá con otros términos de búsqueda</p>
                <Link
                  href="/tienda"
                  onClick={handleProductClick}
                  className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
                >
                  Ver todos los productos
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
