'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Star, TrendingUp, CreditCard, MapPin, ChevronLeft } from 'lucide-react';
import { mockSucursales } from '@/lib/mockData';
import ProductCard from '@/components/shop/ProductCard';
import axios from '@/lib/axios';
import { Producto, PaginatedResponse, Banner } from '@/types';
import { normalizeProductImages } from '@/utils/format';

// Tipo para promociones de pago desde el CMS
interface PaymentPromotion {
  id: string;
  bankName: string;
  imageUrl: string;
  promotionText: string;
  validFrom: string;
  validUntil: string;
}

type ApiProduct = Omit<Producto, 'imagenes'> & { imagenes: Array<string | { url: string }> };

export default function HomeClient({
  initialProductosRecientes,
  initialProductosLiquidacion,
  initialBanners,
}: {
  initialProductosRecientes: Producto[];
  initialProductosLiquidacion: Producto[];
  initialBanners: Banner[];
}) {
  const [currentBanner, setCurrentBanner] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const [productosRecientes, setProductosRecientes] = React.useState<Producto[]>(initialProductosRecientes);
  const [productosLiquidacion, setProductosLiquidacion] = React.useState<Producto[]>(initialProductosLiquidacion);
  const [banners, setBanners] = React.useState<Banner[]>(initialBanners);
  const [loadingRecientes, setLoadingRecientes] = React.useState(false);
  const [loadingLiquidacion, setLoadingLiquidacion] = React.useState(false);
  const [paymentPromotions, setPaymentPromotions] = React.useState<PaymentPromotion[]>([]);

  // Cargar promociones de pago desde el CMS
  React.useEffect(() => {
    const fetchPaymentPromotions = async () => {
      try {
        const response = await axios.get('/public/site-content/home_payment_promotions');
        if (response.data.success && response.data.content?.content) {
          const promotions: PaymentPromotion[] = JSON.parse(response.data.content.content);
          // Filtrar promociones vigentes
          const now = new Date();
          const validPromotions = promotions.filter((promo) => {
            const validFrom = new Date(promo.validFrom);
            const validUntil = new Date(promo.validUntil);
            return now >= validFrom && now <= validUntil;
          });
          setPaymentPromotions(validPromotions);
        }
      } catch (error) {
        console.log('No hay promociones de pago publicadas');
      }
    };

    fetchPaymentPromotions();
  }, []);

  // Recargar banners desde la API para obtener datos frescos
  React.useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get('/promotions');
        console.log('🏠 [HomePage] Banners refrescados desde API:', response.data.data.length);
        response.data.data.forEach((banner: Banner, index: number) => {
          console.log(`  ${index + 1}. "${banner.titulo}" → Enlace: "${banner.enlace || '(sin enlace)'}"`);
        });
        setBanners(response.data.data || []);
      } catch (error) {
        console.error('Error al recargar banners:', error);
      }
    };

    fetchBanners();
  }, []);

  // Filtrar solo banners activos
  const activeBanners = banners.filter(b => b.activo);

  // Log cuando cambien los banners (para debug)
  React.useEffect(() => {
    console.log('🏠 [HomePage] Banners actuales en estado:', banners.length);
    banners.forEach((banner, index) => {
      console.log(`  ${index + 1}. "${banner.titulo}" → Enlace: "${banner.enlace || '(sin enlace)'}" [${banner.activo ? 'Activo' : 'Inactivo'}]`);
    });
  }, [banners]);

  // Distancia mínima para detectar un swipe (en px)
  const minSwipeDistance = 50;

  // Funciones de navegación
  const nextSlide = () => {
    setCurrentBanner((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setCurrentBanner((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  // Manejo de gestos táctiles
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
      setIsAutoPlaying(false);
    } else if (isRightSwipe) {
      prevSlide();
      setIsAutoPlaying(false);
    }
  };

  // Auto-play para el carrusel
  React.useEffect(() => {
    if (!isAutoPlaying || activeBanners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, activeBanners.length]);

  // Función para aleatorizar array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Normalizar productos de la API
  const normalizeProduct = (p: ApiProduct): Producto => ({
    ...p,
    imagenes: normalizeProductImages(p.imagenes),
  });

  // Cargar productos recientes (fallback client-only si no vino SSR)
  React.useEffect(() => {
    if (initialProductosRecientes) return;

    const fetchProductosRecientes = async () => {
      setLoadingRecientes(true);
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('pageSize', '100');

        const res = await axios.get<PaginatedResponse<ApiProduct>>(`/products?${params.toString()}`);
        const normalized = res.data.data.map(normalizeProduct);
        const randomized = shuffleArray(normalized).slice(0, 8);
        setProductosRecientes(randomized);
      } catch (error) {
        console.error('Error al cargar productos recientes:', error);
        setProductosRecientes([]);
      } finally {
        setLoadingRecientes(false);
      }
    };

    fetchProductosRecientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar productos en liquidación (fallback client-only si no vino SSR)
  React.useEffect(() => {
    if (initialProductosLiquidacion) return;

    const fetchProductosLiquidacion = async () => {
      setLoadingLiquidacion(true);
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('pageSize', '100');
        params.set('enLiquidacion', 'true');

        const res = await axios.get<PaginatedResponse<ApiProduct>>(`/products?${params.toString()}`);
        const normalized = res.data.data.map(normalizeProduct);
        const randomized = shuffleArray(normalized).slice(0, 4);
        setProductosLiquidacion(randomized);
      } catch (error) {
        console.error('Error al cargar productos en liquidación:', error);
        setProductosLiquidacion([]);
      } finally {
        setLoadingLiquidacion(false);
      }
    };

    fetchProductosLiquidacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      {/* SECCIÓN 1: CARRUSEL HERO */}
      {activeBanners.length > 0 && (
      <section
        className="relative h-[500px] md:h-[600px] overflow-hidden group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {activeBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentBanner ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="relative w-full h-full bg-linear-to-r from-primary/20 to-secondary/20">
              <Image
                src={banner.imagen}
                alt={banner.titulo}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex items-center">
                <div className="container-custom">
                  <div className="max-w-2xl text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">
                      {banner.titulo}
                    </h1>
                    <p className="text-lg md:text-xl mb-8 animate-slide-up">
                      {banner.descripcion}
                    </p>
                    {banner.enlace && (
                      <Link
                        href={banner.enlace}
                        onClick={() => console.log(`🔗 Navegando a: "${banner.enlace}" desde banner: "${banner.titulo}"`)}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Ver más
                        <ChevronRight size={20} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Botones de navegación */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-dark p-3 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-dark p-3 rounded-full shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
              aria-label="Imagen siguiente"
            >
              <ChevronRight size={24} />
            </button>

            {/* Indicadores */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentBanner(index);
                    setIsAutoPlaying(false);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentBanner ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
      )}

      {/* SECCIÓN 2: PRODUCTOS RECIÉN ADQUIERIDOS */}
      <section className="container-custom py-16">
        <div className="flex items-center justify-center gap-3 mb-8 mt-16">
          <TrendingUp className="text-primary" size={32} />
          <h2 className="text-3xl font-bold text-dark">Otras clientes recién compraron</h2>
        </div>
        {loadingRecientes ? (
          <div className="text-center py-16 text-gray-500">Cargando productos...</div>
        ) : productosRecientes.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productosRecientes.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/tienda"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
              >
                Ver más productos
                <ChevronRight size={20} />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Aún no hay productos disponibles</p>
            <p className="text-sm text-gray-400">Los productos aparecerán aquí cuando se agreguen desde el CMS</p>
          </div>
        )}
      </section>

      {/* SECCIÓN 3: LIQUIDACIÓN */}
      <section className="bg-linear-to-r from-error/10 to-warning/10 py-16 mt-16">
        <div className="container-custom">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-2 bg-error text-white font-bold rounded-full mb-4">
              🔥 LIQUIDACIÓN
            </span>
            <h2 className="text-3xl font-bold text-dark mb-2">Hasta 50% OFF</h2>
            <p className="text-gray">Aprovechá los descuentos en productos seleccionados</p>
          </div>
          {loadingLiquidacion ? (
            <div className="text-center py-16 text-gray-500">Cargando productos en liquidación...</div>
          ) : productosLiquidacion.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productosLiquidacion.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
              <div className="text-center mt-12 mb-8">
                <Link
                  href="/tienda?enLiquidacion=true"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-error hover:bg-error/90 text-white font-medium rounded-lg transition-colors"
                >
                  Ver todos los productos en liquidación
                  <ChevronRight size={20} />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">Aún no hay productos en liquidación</p>
              <p className="text-sm text-gray-400">Los productos en oferta aparecerán aquí cuando se marquen en el CMS</p>
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN 4: MÉTODOS DE PAGO Y PROMOCIONES */}
      {paymentPromotions.length > 0 && (
        <section className="container-custom pt-16 pb-32">
          <div className="flex items-center justify-center gap-3 mb-8">
            <CreditCard className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-dark">Medios de pago y promociones</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paymentPromotions.map((promo) => (
              <div key={promo.id} className="card p-6">
                <div className="h-64 mb-6 flex items-center justify-center">
                  {promo.imageUrl ? (
                    <Image 
                      src={promo.imageUrl} 
                      alt={promo.bankName} 
                      width={800} 
                      height={320}
                      className="object-contain h-full w-full"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-primary">{promo.bankName}</div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-dark mb-2">{promo.bankName}</h3>
                <p className="text-gray mb-4">{promo.promotionText}</p>
                <p className="text-sm text-gray">
                  Válido hasta {new Date(promo.validUntil).toLocaleDateString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN 5: NUESTRAS SUCURSALES */}
      <section className="bg-gray-light py-16 mt-16">
        <div className="container-custom">
          <div className="flex items-center justify-center gap-3 mb-8">
            <MapPin className="text-primary" size={32} />
            <h2 className="text-3xl font-bold text-dark">¿Dónde nos podés encontrar?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mockSucursales.map((sucursal) => (
              <div key={sucursal.id} className="card p-6">
                <h3 className="text-xl font-bold text-dark mb-2">{sucursal.nombre}</h3>
                <p className="text-gray mb-2">
                  {sucursal.direccion.calle} {sucursal.direccion.numero}, {sucursal.direccion.ciudad}
                </p>
                <p className="text-sm text-gray mb-4">{sucursal.horarios}</p>
                <div className="w-full h-64 bg-gray-300 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://maps.google.com/maps?q=${sucursal.coordenadas.lat},${sucursal.coordenadas.lng}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title={`Mapa de ubicación de ${sucursal.nombre}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN 6: RESEÑAS GOOGLE MY BUSINESS */}
      <section className="container-custom py-16 mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 mt-12">
              <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-dark mb-4">¡Tu opinión es muy importante!</h2>
            <p className="text-gray-600 text-lg mb-6">
              Ayúdanos a mejorar y comparte tu experiencia con otros clientes
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 shadow-lg border border-blue-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-dark mb-4">Dejá tu reseña en Google</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <p className="text-gray-700 pt-1">Hacé clic en el botón "Dejar reseña"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <p className="text-gray-700 pt-1">Seleccioná las estrellas según tu experiencia</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <p className="text-gray-700 pt-1">Escribí tu comentario y publicalo</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic">
                  * Necesitás tener una cuenta de Google para dejar tu reseña
                </p>
              </div>

              <div className="text-center md:text-right">
                <div className="mb-6">
                  <div className="flex justify-center md:justify-end gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={32}
                        className="fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 font-medium">Tu opinión nos ayuda a crecer</p>
                </div>
                <a
                  href="https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Dejar Reseña
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <p className="text-gray-600">Anónimo si preferís</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-primary mb-2">2 min</div>
              <p className="text-gray-600">Es rápido y fácil</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-primary mb-2">♥</div>
              <p className="text-gray-600">Nos ayuda muchísimo</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
