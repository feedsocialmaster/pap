'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/toastStore';
import { formatPrice, getProductUrl } from '@/utils/format';
import Button from '@/components/ui/Button';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const toast = useToast();

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info('Inicia sesión', 'Debes iniciar sesión para ver tu lista de deseos');
      router.push('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, router, toast]);

  // Mostrar nada mientras redirige
  if (!isAuthenticated) {
    return null;
  }

  const handleAddToCart = (producto: typeof items[0]) => {
    // Agregar al carrito con el primer talle disponible
    const talle = producto.talles[0];
    addToCart(producto, 1, talle);
    
    toast.success('¡Agregado al carrito!', `${producto.nombre} (Talle ${talle})`);
  };

  const handleAddAllToCart = () => {
    items.forEach((producto) => {
      const talle = producto.talles[0];
      addToCart(producto, 1, talle);
    });
    
    toast.success('¡Todos agregados!', `${items.length} productos en tu carrito`);
  };

  const handleClearWishlist = () => {
    const itemCount = items.length;
    clearWishlist();
    toast.info('Lista limpiada', `Se eliminaron ${itemCount} productos`);
  };

  if (items.length === 0) {
    return (
      <div className="container-custom py-16 mt-60">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-32 h-32 bg-gray-light rounded-full flex items-center justify-center mx-auto mb-6 mt-24">
            <Heart className="text-gray" size={64} />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-4">
            Tu lista de deseos está vacía
          </h1>
          <p className="text-gray mb-8">
            Agregá productos a tu lista de deseos para guardarlos y comprarlos más tarde
          </p>
          <Link href="/tienda" className="btn-primary inline-block">
            Explorar Productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-dark mb-2">Mi Lista de Deseos</h1>
          <p className="text-gray">{items.length} producto{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleAddAllToCart}
            variant="primary"
            className="hidden md:flex"
          >
            <ShoppingCart size={20} />
            Agregar Todo al Carrito
          </Button>
          <Button
            onClick={() => {
              if (confirm('¿Estás segura de que querés eliminar todos los productos de tu lista?')) {
                handleClearWishlist();
              }
            }}
            variant="outline"
          >
            <Trash2 size={20} />
            Limpiar Lista
          </Button>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((producto) => (
          (() => {
            const primeraImagen = producto.imagenes?.[0];
            const imagenUrl = typeof primeraImagen === 'string'
              ? primeraImagen
              : primeraImagen?.url || '/placeholder-product.jpg';
            return (
          <div key={producto.id} className="card overflow-hidden group">
            {/* Imagen */}
            <div className="relative aspect-square bg-gray-light overflow-hidden">
              <Link href={getProductUrl(producto)}>
                <img
                  src={imagenUrl}
                  alt={producto.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </Link>
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {producto.enLiquidacion && producto.porcentajeDescuento && (
                  <span className="bg-error text-white text-xs font-bold px-2 py-1 rounded">
                    -{producto.porcentajeDescuento}%
                  </span>
                )}
                {producto.esFiesta && (
                  <span className="bg-accent text-dark text-xs font-bold px-2 py-1 rounded">
                    ⭐ Fiesta
                  </span>
                )}
              </div>

              {/* Botón Eliminar */}
              <button
                onClick={() => removeItem(producto.id)}
                className="absolute top-3 right-3 w-10 h-10 bg-white hover:bg-error hover:text-white rounded-full flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Eliminar de favoritos"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Información */}
            <div className="p-4">
              <Link href={getProductUrl(producto)}>
                <h3 className="font-semibold text-dark mb-1 hover:text-primary transition-colors line-clamp-2">
                  {producto.nombre}
                </h3>
              </Link>
              <p className="text-sm text-gray mb-3">{producto.tipoCalzado}</p>

              {/* Precio */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-primary">
                  {formatPrice(producto.precio)}
                </span>
              </div>

              {/* Talles Disponibles */}
              <div className="flex items-center gap-1 mb-4">
                <span className="text-xs text-gray">Talles:</span>
                <div className="flex gap-0.5">
                  {producto.talles.slice(0, 6).map((talle) => (
                    <span
                      key={talle}
                      className="text-xs bg-gray-light px-1 py-0.5 rounded"
                    >
                      {talle}
                    </span>
                  ))}
                  {producto.talles.length > 6 && (
                    <span className="text-xs text-gray">+{producto.talles.length - 6}</span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddToCart(producto)}
                  variant="primary"
                  size="sm"
                  fullWidth
                >
                  <ShoppingCart size={16} />
                  Agregar al Carrito
                </Button>
                <Link
                  href={getProductUrl(producto)}
                  className="px-4 py-2 border-2 border-gray-light hover:border-primary rounded-lg transition-colors flex items-center justify-center"
                >
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
            );
          })()
        ))}
      </div>

      {/* CTA Bottom */}
      <div className="mt-12 text-center">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          Seguir explorando productos
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
