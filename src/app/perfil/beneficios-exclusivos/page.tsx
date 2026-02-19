'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Tag, Crown, Star, ShoppingBag, Sparkles, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import axios from '@/lib/axios';
import { formatPrice, getProductUrl } from '@/utils/format';

interface ProductoPremium {
  id: string;
  nombre: string;
  slug: string;
  tipoCalzado: string;
  precio: number;
  imagenes: Array<{url: string} | string>;
  descripcion: string;
}

interface Cupon {
  id: string;
  codigo: string;
  descuento: number;
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO';
  descripcion?: string;
  fechaFin?: string;
}

export default function BeneficiosExclusivosPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [productosPremium, setProductosPremium] = useState<ProductoPremium[]>([]);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBeneficios();
  }, [isAuthenticated]);

  const fetchBeneficios = async () => {
    try {
      setLoading(true);
      // TODO: Implementar endpoints para obtener productos premium y cupones del usuario
      // Por ahora usamos datos de ejemplo
      setProductosPremium([]);
      setCupones([]);
    } catch (error) {
      console.error('Error al cargar beneficios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <div>
              <h1 className="text-4xl font-bold text-white text-center">
                Beneficios Exclusivos
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Introducción */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Tus Beneficios Exclusivos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Accedé a beneficios especiales y ofertas exclusivas. ¡Aprovechalos!
          </p>
        </div>

        {/* Cupones Exclusivos */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Cupones de Descuento Exclusivos
            </h3>
          </div>

          {cupones.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <Lock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No tenés cupones disponibles en este momento
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Los cupones exclusivos aparecerán aquí cuando sean asignados desde nuestro sistema
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cupones.map((cupon) => (
                <div
                  key={cupon.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-primary hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Tag className="w-6 h-6 text-primary" />
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full">
                      Activo
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {cupon.codigo}
                  </h4>
                  <p className="text-3xl font-bold text-primary mb-2">
                    {cupon.tipoDescuento === 'PORCENTAJE'
                      ? `${cupon.descuento}%`
                      : formatPrice(cupon.descuento)}
                  </p>
                  {cupon.descripcion && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {cupon.descripcion}
                    </p>
                  )}
                  {cupon.fechaFin && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Válido hasta {new Date(cupon.fechaFin).toLocaleDateString('es-AR')}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cupon.codigo);
                      alert('¡Código copiado al portapapeles!');
                    }}
                    className="mt-4 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Copiar Código
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Productos Premium */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Acceso Premium a Productos Exclusivos
            </h3>
          </div>

          {productosPremium.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <Lock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay productos premium disponibles para vos
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Cuando tengamos lanzamientos exclusivos o accesos anticipados, aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosPremium.map((producto) => {
                const primeraImagen = producto.imagenes?.[0];
                const imagenUrl = typeof primeraImagen === 'string'
                  ? primeraImagen
                  : primeraImagen?.url || '/placeholder-product.jpg';

                return (
                  <div
                    key={producto.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => router.push(getProductUrl(producto))}
                  >
                    <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
                      <img
                        src={imagenUrl}
                        alt={producto.nombre}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                        <Crown className="w-4 h-4" />
                        Premium
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {producto.nombre}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {producto.descripcion}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(producto.precio)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Beneficios generales */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tus Beneficios
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ofertas Especiales
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Aprovechá ofertas y beneficios exclusivos en productos seleccionados
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Descuentos Exclusivos
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Recibí cupones de descuento personalizados y ofertas especiales antes que nadie
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acceso Anticipado
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Sé la primera en ver y comprar nuestros nuevos productos antes del lanzamiento oficial
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Eventos Exclusivos
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Participá en eventos especiales y actividades diseñadas solo para nuestros miembros
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary to-accent rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            ¿Querés descubrir más beneficios?
          </h3>
          <p className="mb-6 opacity-90">
            Explorá nuestra tienda y encontrá las mejores ofertas y productos exclusivos
          </p>
          <button
            onClick={() => router.push('/tienda')}
            className="px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            Explorar Tienda
          </button>
        </div>
      </div>
    </div>
  );
}
