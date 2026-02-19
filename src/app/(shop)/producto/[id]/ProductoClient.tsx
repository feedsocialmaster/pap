'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Check, Ruler, Minus, Plus } from 'lucide-react';
import { formatPrice, calculateDiscount } from '@/utils/format';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useToast } from '@/store/toastStore';
import Button from '@/components/ui/Button';
import ImageZoom from '@/components/ui/ImageZoom';
import ImageLightbox from '@/components/ui/ImageLightbox';
import ShareProductModal from '@/components/shop/ShareProductModal';
import { Producto } from '@/types';
import { ColorSwatch } from '@/components/shop/ColorSwatch';
import { COLOR_PALETTE } from '@/utils/color-utils';
import { GUIA_TALLES_MUJER } from '@/lib/sizeGuide';

export default function ProductoClient({ producto }: { producto: Producto }) {
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();

  // Fix hydration mismatch: defer wishlist check to client-side
  const [inWishlist, setInWishlist] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setInWishlist(isInWishlist(producto.id));
  }, [producto.id, isInWishlist]);

  // Normalizar URLs de imágenes: convertir URLs absolutas a relativas
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    // Si la URL es absoluta (http://localhost:3001/uploads/...), convertirla a relativa
    const match = url.match(/https?:\/\/[^\/]+(\/uploads\/.+)$/);
    if (match) return match[1];
    // Si ya es relativa, devolverla tal cual
    return url;
  };

  // Debug logging
  console.log('[ProductoClient] Producto completo:', producto);
  console.log('[ProductoClient] Talles:', producto.talles);
  console.log('[ProductoClient] Imagenes:', producto.imagenes);
  console.log('[ProductoClient] Stock:', producto.stock);
  console.log('[ProductoClient] Métodos de Pago:', producto.metodosPago);

  // Asegurar que imagenes sea siempre un array y normalizar URLs
  // Las imágenes pueden venir como strings o como objetos { url, alt, orden }
  const imagenes = (producto.imagenes || []).map((img: any) => {
    if (typeof img === 'string') {
      return normalizeImageUrl(img);
    }
    return normalizeImageUrl(img.url);
  });
  
  console.log('[ProductoClient] Imágenes normalizadas:', imagenes);

  const [imagenActual, setImagenActual] = useState(0);
  const [talleSeleccionado, setTalleSeleccionado] = useState<number | null>(null);
  const [colorSeleccionado, setColorSeleccionado] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [mostrarGuiaTalles, setMostrarGuiaTalles] = useState(false);
  const [agregadoAlCarrito, setAgregadoAlCarrito] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const precioFinal = producto.enLiquidacion && producto.porcentajeDescuento
    ? producto.precio * (1 - producto.porcentajeDescuento / 100)
    : producto.precio;

  // Helper para obtener el nombre del color desde el código hex
  const getColorName = (hexCode: string): string => {
    const normalizedHex = hexCode.toUpperCase();
    const colorObj = COLOR_PALETTE.find(c => c.hex.toUpperCase() === normalizedHex);
    return colorObj?.name || hexCode;
  };

  const handleAgregarCarrito = () => {
    if (!talleSeleccionado) {
      toast.warning('Seleccioná un talle', 'Por favor elegí tu talle antes de continuar');
      return;
    }

    addItem(producto, cantidad, talleSeleccionado, colorSeleccionado || undefined);
    setAgregadoAlCarrito(true);

    toast.success('¡Agregado al carrito!', `${producto.nombre} (Talle ${talleSeleccionado})`);

    setTimeout(() => {
      setAgregadoAlCarrito(false);
    }, 3000);
  };

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(producto.id);
      setInWishlist(false);
      toast.info('Eliminado de favoritos', producto.nombre);
    } else {
      addToWishlist(producto);
      setInWishlist(true);
      toast.success('¡Agregado a favoritos!', producto.nombre);
    }
  };

  const cambiarImagen = (direccion: 'prev' | 'next') => {
    if (direccion === 'prev') {
      setImagenActual((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
    } else {
      setImagenActual((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <main className="container-custom py-8" style={{ marginTop: '65px' }}>
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: producto.nombre,
            image: imagenes,
            description: producto.descripcion,
            brand: 'Paso a Paso',
            sku: producto.id,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'ARS',
              price: precioFinal.toFixed(2),
              availability: producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          }),
        }}
      />

      {/* Breadcrumb */}
      <nav className="mb-8 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-gray">
          <li><Link href="/" className="hover:text-primary">Inicio</Link></li>
          <li>/</li>
          <li><Link href="/tienda" className="hover:text-primary">Tienda</Link></li>
          <li>/</li>
          <li className="text-dark font-medium">{producto.nombre}</li>
        </ol>
      </nav>

      <article className="grid grid-cols-1 lg:grid-cols-2 gap-12" itemScope itemType="http://schema.org/Product">
        {/* COLUMNA IZQUIERDA: Galería de Imágenes */}
        <section className="mt-6" aria-label="Galería de imágenes del producto">
          {/* Imagen Principal con Zoom */}
          <div className="relative aspect-square mb-4">
            {imagenes.length > 0 ? (
              <ImageZoom
                src={imagenes[imagenActual]}
                alt={producto.nombre}
                onClickExpand={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-light flex items-center justify-center text-gray">
                <p>Sin imagen disponible</p>
              </div>
            )}

            {/* Badges sobre la imagen */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none z-10" aria-hidden="true">
              {producto.enLiquidacion && producto.porcentajeDescuento && (
                <span className="badge-liquidacion shadow-lg">-{producto.porcentajeDescuento}%</span>
              )}
            </div>

            {/* Controles de navegación */}
            {imagenes.length > 1 && (
              <>
                <button
                  onClick={() => cambiarImagen('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-20 transition-all"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => cambiarImagen('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-20 transition-all"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {imagenes.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pt-2 pb-3 pl-0.5">
              {imagenes.map((imagen, index) => (
                <button
                  key={`miniatura-${imagen}-${index}`}
                  onClick={() => setImagenActual(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg border-2 transition-all ${
                    index === imagenActual ? 'border-primary scale-105' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <Image
                    src={imagen}
                    alt={`${producto.nombre} - imagen ${index + 1}`}
                    fill
                    className="object-cover rounded-md"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* COLUMNA DERECHA: Información del Producto */}
        <section className="space-y-6 mt-6" aria-label="Información del producto">
          {/* Título y Categoría */}
          <header>
            <p className="text-sm text-gray mb-2">{producto.tipoCalzado}</p>
            <h1 className="text-3xl font-bold text-dark mb-2" itemProp="name">{producto.nombre}</h1>
            {/* Badge de Producto en Lanzamiento */}
            {producto.productoEnLanzamiento && (
              <span className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                🚀 NUEVO LANZAMIENTO
              </span>
            )}
            {/* Badge de Promoción Activa */}
            {producto.promocionActiva && (
              <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full ml-2">
                🎉 {producto.promocionActiva.tipoDescuento === 'DOS_POR_UNO' ? '2x1' : `${producto.promocionActiva.valorDescuento}% OFF`}
                {producto.promocionActiva.leyendaPersonalizada && ` - ${producto.promocionActiva.leyendaPersonalizada}`}
              </span>
            )}
          </header>

          {/* Precio */}
          <div className="bg-gray-light p-4 rounded-xl" itemProp="offers" itemScope itemType="http://schema.org/Offer">
            {/* Precio con liquidación */}
            {producto.enLiquidacion && producto.porcentajeDescuento ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl text-gray line-through">
                    {formatPrice(producto.precio)}
                  </span>
                  <span className="badge bg-error text-white text-lg px-3 py-1">
                    -{producto.porcentajeDescuento}%
                  </span>
                </div>
                <div className="text-4xl font-bold text-error">
                  {formatPrice(precioFinal)}
                </div>
              </>
            ) : (
              <div className="text-4xl font-bold text-dark">
                {formatPrice(producto.precio)}
              </div>
            )}
            
            <p className="text-sm text-gray mt-3">
              💳 Hasta 12 cuotas sin interés de {formatPrice(precioFinal / 12)}
            </p>
          </div>

          {/* Opciones de Disponibilidad */}
          {(producto.retiroEnLocal || producto.envioNacional || producto.envioLocal) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-dark dark:text-white mb-3">📦 Opciones de Entrega</h4>
              <div className="space-y-2">
                {producto.retiroEnLocal && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700 dark:text-gray-300">Retiro en Local</span>
                  </div>
                )}
                {producto.envioLocal && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700 dark:text-gray-300">Envío Local</span>
                  </div>
                )}
                {producto.envioNacional && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700 dark:text-gray-300">Envío a todo el país</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selector de Color */}
          {producto.colores && Array.isArray(producto.colores) && producto.colores.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-dark mb-3">
                Color: {colorSeleccionado || 'Seleccionar'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {producto.colores.map((color, idx) => {
                  const colorValue = typeof color === 'string' ? color : color.hex;
                  const colorLabel = typeof color === 'string' ? color : color.nombre;
                  return (
                    <button
                      key={`${colorValue}-${idx}`}
                      onClick={() => setColorSeleccionado(colorValue)}
                      className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                        colorSeleccionado === colorValue
                          ? 'border-primary scale-110 shadow-lg ring-2 ring-primary ring-offset-2'
                          : 'border-gray-300 hover:border-primary hover:scale-105'
                      }`}
                      style={{ backgroundColor: colorValue }}
                      title={colorLabel}
                      aria-label={`Color ${colorLabel}`}
                    >
                      {colorSeleccionado === colorValue && (
                        <Check size={20} className="absolute inset-0 m-auto text-white drop-shadow" />
                      )}
                    </button>
                  );
                })}
              </div>
              {colorSeleccionado && (
                <p className="text-xs text-gray mt-2">
                  Color seleccionado: {getColorName(colorSeleccionado)}
                </p>
              )}
            </div>
          )}

          {/* Selector de Talle */}
          <fieldset>
            <div className="flex items-center justify-between mb-3">
              <legend className="text-sm font-medium text-dark">
                Talle: {talleSeleccionado || 'Seleccionar'}
              </legend>
              <button
                onClick={() => setMostrarGuiaTalles(true)}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Ruler size={16} />
                Guía de talles
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {(producto.talles && producto.talles.length > 0) ? (
                producto.talles.map((talle) => (
                  <button
                    key={talle}
                    onClick={() => setTalleSeleccionado(talle)}
                    className={`py-1 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      talleSeleccionado === talle
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {talle}
                  </button>
                ))
              ) : (
                <p className="text-gray col-span-6">No hay talles disponibles</p>
              )}
            </div>
          </fieldset>

          {/* Selector de Cantidad */}
          <div>
            <label className="block text-sm font-medium text-dark mb-2">Cantidad</label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-8 h-8 rounded border border-gray-300 hover:border-primary flex items-center justify-center transition-colors text-xs"
                disabled={cantidad <= 1}
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, parseInt(e.target.value) || 1)))}
                className="w-12 h-8 text-center border border-gray-300 rounded font-medium text-sm"
                min="1"
                max={producto.stock}
              />
              <button
                onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                className="w-8 h-8 rounded border border-gray-300 hover:border-primary flex items-center justify-center transition-colors text-xs"
                disabled={cantidad >= producto.stock}
              >
                <Plus size={16} />
              </button>
              <span className="text-xs text-gray ml-1">
                Stock: {producto.stock}
              </span>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-gray-light p-4 rounded-xl">
            <h4 className="font-medium text-dark mb-3">Medios de pago</h4>
            <div className="flex flex-wrap gap-2">
              {producto.metodosPago ? (
                <>
                  {/* Tarjetas */}
                  {producto.metodosPago.tarjetas && producto.metodosPago.tarjetas.length > 0 && 
                    producto.metodosPago.tarjetas.map((tarjeta) => (
                      <span key={tarjeta} className="px-3 py-1 bg-white rounded text-sm border">
                        {tarjeta}
                      </span>
                    ))
                  }
                  {/* Transferencia Bancaria */}
                  {producto.metodosPago.transferenciaBancaria && (
                    <span className="px-3 py-1 bg-white rounded text-sm border">
                      Transferencia Bancaria
                    </span>
                  )}
                  {/* Mercado Pago */}
                  {producto.metodosPago.mercadoPago && (
                    <span className="px-3 py-1 bg-white rounded text-sm border">
                      Mercado Pago
                    </span>
                  )}
                  {/* Otros métodos */}
                  {producto.metodosPago.otros && producto.metodosPago.otros.length > 0 &&
                    producto.metodosPago.otros.map((metodo) => (
                      <span key={metodo} className="px-3 py-1 bg-white rounded text-sm border">
                        {metodo}
                      </span>
                    ))
                  }
                  {/* Si no hay métodos configurados, mostrar mensaje */}
                  {(!producto.metodosPago.tarjetas || producto.metodosPago.tarjetas.length === 0) &&
                   !producto.metodosPago.transferenciaBancaria &&
                   !producto.metodosPago.mercadoPago &&
                   (!producto.metodosPago.otros || producto.metodosPago.otros.length === 0) && (
                    <span className="text-sm text-gray-500">No hay métodos de pago configurados</span>
                  )}
                </>
              ) : (
                // Fallback si no hay metodosPago configurado
                <>
                  {['Visa', 'Mastercard', 'American Express', 'Mercado Pago'].map((metodo) => (
                    <span key={metodo} className="px-3 py-1 bg-white rounded text-sm border">
                      {metodo}
                    </span>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-3">
            {agregadoAlCarrito ? (
              <div className="flex items-center justify-center gap-2 py-4 bg-success/10 text-success rounded-lg">
                <Check size={20} />
                <span className="font-medium">¡Agregado al carrito!</span>
              </div>
            ) : (
              <Button
                onClick={handleAgregarCarrito}
                fullWidth
                size="lg"
                className="flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                AGREGAR AL CARRITO
              </Button>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleWishlistToggle}
                className={`flex-1 py-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  isClient && inWishlist
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                <Heart size={20} fill={isClient && inWishlist ? 'currentColor' : 'none'} />
                <span className="font-medium">
                  {isClient && inWishlist ? 'En Favoritos' : 'Favoritos'}
                </span>
              </button>
              <button 
                onClick={() => setShareModalOpen(true)}
                className="flex-1 py-3 border-2 border-gray-300 hover:border-primary rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 size={20} />
                <span className="font-medium">Compartir</span>
              </button>
            </div>
          </div>
        </section>
      </article>

      {/* Sección de Características */}
      <section className="mt-24">
        <h2 className="text-2xl font-bold text-dark mb-6">Características</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-light p-4 rounded-xl text-center">
            <span className="text-3xl mb-2 block">👗</span>
            <p className="text-sm text-gray mb-1">Calzado de fiesta</p>
            <p className="font-medium">{producto.esFiesta ? 'Sí' : 'No'}</p>
          </div>
          <div className="bg-gray-light p-4 rounded-xl text-center">
            <span className="text-3xl mb-2 block">💧</span>
            <p className="text-sm text-gray mb-1">Impermeable</p>
            <p className="font-medium">{producto.impermeable ? 'Sí' : 'No'}</p>
          </div>
          <div className="bg-gray-light p-4 rounded-xl text-center">
            <span className="text-3xl mb-2 block">👟</span>
            <p className="text-sm text-gray mb-1">Suela antideslizante</p>
            <p className="font-medium">{producto.antideslizante ? 'Sí' : 'No'}</p>
          </div>
          <div className="bg-gray-light p-4 rounded-xl text-center">
            <span className="text-3xl mb-2 block">📦</span>
            <p className="text-sm text-gray mb-1">Stock disponible</p>
            <p className="font-medium">{producto.stock} unidades</p>
          </div>
        </div>

        {/* Características adicionales */}
        {producto.caracteristicas.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-dark mb-3">Detalles adicionales:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {producto.caracteristicas.map((caracteristica, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check size={16} className="text-success" />
                  <span className="text-gray">{caracteristica}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Modal: Guía de Talles */}
      {mostrarGuiaTalles && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
          onClick={() => setMostrarGuiaTalles(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guia-talles-titulo"
        >
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 id="guia-talles-titulo" className="text-2xl font-bold text-dark">Guía de Talles</h3>
              <button
                onClick={() => setMostrarGuiaTalles(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-light flex items-center justify-center"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center">
                <thead>
                  <tr className="bg-gray-light">
                    <th className="py-3 px-4 font-semibold">TALLE MUJER</th>
                    <th className="py-3 px-4 font-semibold">LARGO DEL PIE (CM)</th>
                    <th className="py-3 px-4 font-semibold">TALLE US MUJER</th>
                  </tr>
                </thead>
                <tbody>
                  {GUIA_TALLES_MUJER.map((talle) => (
                    <tr key={`${talle.talleMujerArg}-${talle.talleUsMujer}`} className="border-b">
                      <td className="py-3 px-4">{talle.talleMujerArg}</td>
                      <td className="py-3 px-4">{talle.largoPieCm}</td>
                      <td className="py-3 px-4">{talle.talleUsMujer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-dark">
                <strong>Consejo:</strong> Si estás entre dos talles, te recomendamos elegir el talle mayor para mayor comodidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={imagenes}
        currentIndex={imagenActual}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        productName={producto.nombre}
      />

      {/* Share Modal */}
      <ShareProductModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        productUrl={typeof window !== 'undefined' ? window.location.href : ''}
        productName={producto.nombre}
        productDescription={producto.descripcion || ''}
        productImage={imagenes[0] ? (typeof window !== 'undefined' ? `${window.location.origin}${imagenes[0]}` : '') : ''}
      />
    </main>
  );
}
