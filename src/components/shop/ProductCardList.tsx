'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { Producto } from '@/types';
import { formatPrice, getProductUrl } from '@/utils/format';
import { useWishlistStore } from '@/store/wishlistStore';
import { useToast } from '@/store/toastStore';
import { ColorSwatchList } from '@/components/shop/ColorSwatch';

interface ProductCardListProps {
  producto: Producto;
}

const ProductCardList: React.FC<ProductCardListProps> = ({ producto }) => {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(producto.id);
  const toast = useToast();

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      removeItem(producto.id);
      toast.info('Producto eliminado', 'Se quitó de tus favoritos');
    } else {
      addItem(producto);
      toast.success('¡Agregado a favoritos!', `${producto.nombre} está en tu lista`);
    }
  };

  const precioFinal = producto.enLiquidacion && producto.porcentajeDescuento
      ? producto.precio * (1 - producto.porcentajeDescuento / 100)
      : producto.precio;

  const primeraImagen = producto.imagenes?.[0];
  const imagenUrl = typeof primeraImagen === 'string'
    ? primeraImagen
    : primeraImagen?.url || '/placeholder-product.jpg';

  return (
    <Link 
      href={getProductUrl(producto)} 
      className="card p-4 group flex flex-row gap-4 hover:shadow-lg transition-shadow"
    >
      {/* Imagen del producto - más pequeña en formato lista */}
      <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {producto.imagenes && producto.imagenes.length > 0 ? (
          <img
            src={imagenUrl}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-sm">Sin imagen</span>
          </div>
        )}
        
        {/* Badge de descuento */}
        {producto.enLiquidacion && producto.porcentajeDescuento && (
          <span className="absolute top-2 right-2 badge-liquidacion shadow-md">
            -{producto.porcentajeDescuento}%
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 left-2 p-1.5 rounded-full shadow-md transition-all hover:scale-110 ${
            inWishlist 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-dark hover:bg-gray-light'
          }`}
          aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart 
            size={16} 
            fill={inWishlist ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Información del producto - expandida horizontalmente */}
      <div className="flex flex-col md:flex-row flex-1 gap-4">
        {/* Detalles del producto */}
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-sm text-gray mb-1">{producto.tipoCalzado}</p>
          
          <h3 className="font-semibold text-dark text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {producto.nombre}
          </h3>

          {/* Descripción corta si existe */}
          {producto.descripcion && (
            <p className="text-sm text-gray line-clamp-2 mb-2 hidden md:block">
              {producto.descripcion}
            </p>
          )}

          {/* Colores y talles en una fila */}
          <div className="flex flex-wrap items-center gap-4 mt-auto">
            {/* Colores disponibles */}
            {producto.colores && Array.isArray(producto.colores) && producto.colores.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray">Colores:</span>
                <ColorSwatchList
                  colors={producto.colores.map((color) => (typeof color === 'string' ? color : color.hex))}
                  maxVisible={6}
                  size="sm"
                />
              </div>
            )}

            {/* Talles disponibles */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray">Talles:</span>
              <div className="flex flex-wrap gap-1">
                {producto.talles.slice(0, 6).map((talle) => (
                  <span
                    key={talle}
                    className="text-xs px-2 py-0.5 bg-gray-100 rounded"
                  >
                    {talle}
                  </span>
                ))}
                {producto.talles.length > 6 && (
                  <span className="text-xs px-2 py-0.5 text-gray">
                    +{producto.talles.length - 6}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Precios y acciones - alineados a la derecha */}
        <div className="flex flex-col items-start md:items-end justify-between md:min-w-[140px]">
          <div className="text-right">
            {/* Si el producto tiene descuento en liquidación */}
            {producto.enLiquidacion && producto.porcentajeDescuento ? (
              <>
                <div className="flex items-center gap-2 mb-1 md:justify-end">
                  <span className="text-sm text-gray line-through">
                    {formatPrice(producto.precio)}
                  </span>
                  <span className="badge bg-error/20 text-error text-xs">
                    -{producto.porcentajeDescuento}%
                  </span>
                </div>
                <span className="text-xl font-bold text-error">
                  {formatPrice(precioFinal)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-dark">
                {formatPrice(producto.precio)}
              </span>
            )}
          </div>

          <p className="text-xs text-gray mt-1">Hasta 12 cuotas sin interés</p>

          {/* Botón de ver producto */}
          <div className="mt-3 hidden md:block">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg group-hover:bg-primary-dark transition-colors">
              <ShoppingCart size={16} />
              Ver producto
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCardList;
