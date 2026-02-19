'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, Tag, Gift, Sparkles, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, getProductUrl } from '@/utils/format';
import Button from '@/components/ui/Button';
import axios from '@/lib/axios';

interface PromocionInfo {
  id: string;
  titulo: string;
  tipoDescuento: 'PORCENTAJE' | 'DOS_POR_UNO';
  valorDescuento: number;
  leyendaPersonalizada?: string;
}

interface DisponibilidadCodigos {
  disponible: boolean;
  razon?: string;
  promocionBloqueante?: { titulo: string; tipoDescuento: string };
  liquidacionBloqueante?: { productosEnLiquidacion: string[] };
}

// Helper para obtener etiqueta legible del bundle
function getBundleLabel(tipoBundle: string): string {
  const labels: Record<string, string> = {
    'DOS_POR_UNO': '2x1',
    'TRES_POR_DOS': '3x2',
    'CUATRO_POR_TRES': '4x3',
    'CINCO_POR_DOS': '5x2',
    'CINCO_POR_TRES': '5x3',
  };
  return labels[tipoBundle] || tipoBundle;
}

// Helper para calcular descuento de bundle
// Retorna el monto pagado y el descuento total
function calcularDescuentoBundle(
  tipoBundle: string,
  cantidad: number,
  precioUnitario: number
): { montoPagado: number; descuento: number } {
  const configs: Record<string, { llevas: number; pagas: number }> = {
    'DOS_POR_UNO': { llevas: 2, pagas: 1 },
    'TRES_POR_DOS': { llevas: 3, pagas: 2 },
    'CUATRO_POR_TRES': { llevas: 4, pagas: 3 },
    'CINCO_POR_DOS': { llevas: 5, pagas: 2 },
    'CINCO_POR_TRES': { llevas: 5, pagas: 3 },
  };

  const config = configs[tipoBundle];
  if (!config) {
    return { montoPagado: cantidad * precioUnitario, descuento: 0 };
  }

  const { llevas, pagas } = config;
  const gruposCompletos = Math.floor(cantidad / llevas);
  const productosRestantes = cantidad % llevas;
  
  const montoPagadoGrupos = gruposCompletos * pagas * precioUnitario;
  const montoPagadoRestantes = productosRestantes * precioUnitario;
  const montoPagado = montoPagadoGrupos + montoPagadoRestantes;
  const montoOriginal = cantidad * precioUnitario;
  
  return { 
    montoPagado, 
    descuento: montoOriginal - montoPagado 
  };
}

export default function CarritoPage() {
  const router = useRouter();
  const { items, getTotalItems, getSubtotal, updateQuantity, removeItem, clearCart, cuponAplicado, setCupon, removeCupon } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  
  const [codigoCupon, setCodigoCupon] = useState('');
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [cuponesDisponibles, setCuponesDisponibles] = useState<any[]>([]);
  const [mostrarCupones, setMostrarCupones] = useState(false);
  const [promocionesProductos, setPromocionesProductos] = useState<Record<string, PromocionInfo | null>>({});
  const [liquidacionesProductos, setLiquidacionesProductos] = useState<Record<string, { porcentaje: number } | null>>({});
  const [disponibilidadCodigos, setDisponibilidadCodigos] = useState<DisponibilidadCodigos>({ disponible: true });

  // Verificar si hay productos con promoción (para mostrar advertencia informativa)
  // NOTA: Los cupones SIEMPRE se pueden aplicar, pero solo afectan productos SIN promoción vigente
  useEffect(() => {
    const verificarProductosConPromocion = async () => {
      if (!isAuthenticated || items.length === 0) {
        setDisponibilidadCodigos({ disponible: true });
        return;
      }

      try {
        const productIds = items.map(item => item.producto.id);
        const response = await axios.post('/cms/cupones/verificar-disponibilidad', { productIds });
        
        // Los cupones SIEMPRE están disponibles, pero informamos si hay productos con promoción
        const hayProductosConPromocion = !response.data.promo_code_available;
        setDisponibilidadCodigos({
          disponible: true, // Siempre disponible - el cupón aplica solo a productos elegibles
          razon: hayProductosConPromocion 
            ? 'Algunos productos tienen promociones activas. El cupón solo aplicará a productos sin promoción.'
            : undefined,
          promocionBloqueante: response.data.blocked_by_promotion,
          liquidacionBloqueante: response.data.blocked_by_liquidacion
        });
        // Ya NO removemos el cupón - ahora solo aplica a productos elegibles
      } catch (error) {
        console.error('Error al verificar disponibilidad de códigos:', error);
        setDisponibilidadCodigos({ disponible: true });
      }
    };

    verificarProductosConPromocion();
  }, [items, isAuthenticated]);

  // Cargar promociones para productos del carrito
  // IMPORTANTE: Consulta SIEMPRE la API para obtener datos actualizados
  // (los datos del carrito pueden estar desactualizados si la promoción se configuró después de agregar el producto)
  useEffect(() => {
    const cargarPromocionesProductos = async () => {
      if (items.length === 0) return;
      
      console.log('🎯 [Carrito] Cargando promociones y liquidaciones actualizadas para TODOS los productos...');

      const promociones: Record<string, PromocionInfo | null> = {};
      const liquidaciones: Record<string, { porcentaje: number } | null> = {};
      
      // Consultar TODOS los productos para obtener información actualizada de promociones y liquidaciones
      for (const item of items) {
        try {
          const response = await axios.get(`/products/${item.producto.id}`);
          const productData = response.data.data;
          
          // Capturar promociones activas
          if (productData?.promocionActiva) {
            promociones[item.producto.id] = productData.promocionActiva;
            console.log(`✅ [Carrito] Promoción encontrada para ${item.producto.nombre}:`, productData.promocionActiva);
          }
          
          // Capturar liquidaciones (tienen prioridad si no hay promoción activa)
          if (productData?.enLiquidacion && productData?.porcentajeDescuento && !productData?.promocionActiva) {
            liquidaciones[item.producto.id] = { porcentaje: productData.porcentajeDescuento };
            console.log(`🔥 [Carrito] Liquidación encontrada para ${item.producto.nombre}: ${productData.porcentajeDescuento}% OFF`);
          }
        } catch (error) {
          console.error(`Error al cargar promoción/liquidación para ${item.producto.id}:`, error);
        }
      }
      
      setPromocionesProductos(promociones);
      setLiquidacionesProductos(liquidaciones);
    };

    if (items.length > 0) {
      cargarPromocionesProductos();
    }
  }, [items]);

  const subtotal = getSubtotal();
  
  // Calcular descuentos de promociones y liquidaciones
  const descuentosPromociones = useMemo(() => {
    let totalDescuento = 0;
    const detalles: Array<{producto: string, tipo: string, descuento: number}> = [];

    items.forEach(item => {
      // Primero verificar promociones activas
      const promo = promocionesProductos[item.producto.id];
      if (promo) {
        if (promo.tipoDescuento === 'PORCENTAJE') {
          const descuento = (item.precioUnitario * promo.valorDescuento / 100) * item.cantidad;
          totalDescuento += descuento;
          detalles.push({
            producto: item.producto.nombre,
            tipo: `${promo.valorDescuento}% OFF`,
            descuento
          });
        } else if (promo.tipoDescuento === 'DOS_POR_UNO') {
          // 2x1: por cada 2 unidades, una es gratis
          const itemsGratis = Math.floor(item.cantidad / 2);
          const descuento = item.precioUnitario * itemsGratis;
          totalDescuento += descuento;
          if (itemsGratis > 0) {
            detalles.push({
              producto: item.producto.nombre,
              tipo: '2x1',
              descuento
            });
          }
        }
        return; // Si hay promoción activa, no aplicar liquidación
      }

      // Si no hay promoción, verificar liquidación
      const liquidacion = liquidacionesProductos[item.producto.id];
      if (liquidacion) {
        const descuento = (item.precioUnitario * liquidacion.porcentaje / 100) * item.cantidad;
        totalDescuento += descuento;
        detalles.push({
          producto: item.producto.nombre,
          tipo: `${liquidacion.porcentaje}% Liquidación`,
          descuento
        });
      }
    });

    return { total: totalDescuento, detalles };
  }, [items, promocionesProductos, liquidacionesProductos]);
  
  // Calcular descuento del cupón con soporte para bundle, porcentaje o ambos
  // REGLA: El cupón SOLO aplica a productos SIN promoción vigente ni liquidación
  const descuentoCuponInfo = useMemo(() => {
    if (!cuponAplicado) {
      return { descuento: 0, tipo: null, detalle: '', productosAplicables: 0 };
    }

    // Filtrar solo productos SIN promoción vigente ni liquidación
    const productosElegibles = items.filter(item => {
      const tienePromocion = promocionesProductos[item.producto.id] !== undefined && promocionesProductos[item.producto.id] !== null;
      const tieneLiquidacion = liquidacionesProductos[item.producto.id] !== undefined && liquidacionesProductos[item.producto.id] !== null;
      return !tienePromocion && !tieneLiquidacion;
    });

    // Si no hay productos elegibles para el cupón, no aplicar descuento
    if (productosElegibles.length === 0) {
      return { 
        descuento: 0, 
        tipo: null, 
        detalle: 'No hay productos elegibles para este cupón', 
        productosAplicables: 0 
      };
    }

    // Calcular subtotal y cantidad SOLO de productos elegibles
    const subtotalElegible = productosElegibles.reduce(
      (acc, item) => acc + (item.precioUnitario * item.cantidad), 
      0
    );
    const cantidadElegible = productosElegibles.reduce(
      (acc, item) => acc + item.cantidad, 
      0
    );
    const precioPromedioElegible = cantidadElegible > 0 ? subtotalElegible / cantidadElegible : 0;

    const tieneDescuento = cuponAplicado.descuento !== null && cuponAplicado.descuento > 0;
    const tieneBundle = cuponAplicado.tipoBundle !== null && cuponAplicado.tipoBundle !== undefined;

    // Caso 1: Solo porcentaje
    if (tieneDescuento && !tieneBundle) {
      const descuento = cuponAplicado.tipoDescuento === 'PORCENTAJE'
        ? (subtotalElegible * cuponAplicado.descuento!) / 100
        : cuponAplicado.descuento!;
      return { 
        descuento, 
        tipo: 'porcentaje', 
        detalle: `${cuponAplicado.descuento}% de descuento`,
        productosAplicables: cantidadElegible
      };
    }

    // Caso 2: Solo bundle
    if (tieneBundle && !tieneDescuento) {
      const bundleResult = calcularDescuentoBundle(
        cuponAplicado.tipoBundle!,
        cantidadElegible,
        precioPromedioElegible
      );
      return { 
        descuento: bundleResult.descuento, 
        tipo: 'bundle', 
        detalle: `Promoción ${getBundleLabel(cuponAplicado.tipoBundle!)}`,
        productosAplicables: cantidadElegible
      };
    }

    // Caso 3: Ambos (bundle y porcentaje)
    if (tieneBundle && tieneDescuento) {
      // Calcular descuento por porcentaje
      const descuentoPorcentaje = cuponAplicado.tipoDescuento === 'PORCENTAJE'
        ? (subtotalElegible * cuponAplicado.descuento!) / 100
        : cuponAplicado.descuento!;

      // Calcular descuento por bundle
      const bundleResult = calcularDescuentoBundle(
        cuponAplicado.tipoBundle!,
        cantidadElegible,
        precioPromedioElegible
      );

      if (cuponAplicado.combinable) {
        // Con combinable: aplicar bundle primero, luego porcentaje sobre el resultado
        const subtotalDespuesBundle = subtotalElegible - bundleResult.descuento;
        const descuentoPorcentajeSobreBundle = cuponAplicado.tipoDescuento === 'PORCENTAJE'
          ? (subtotalDespuesBundle * cuponAplicado.descuento!) / 100
          : cuponAplicado.descuento!;
        const descuentoTotal = bundleResult.descuento + descuentoPorcentajeSobreBundle;
        
        return { 
          descuento: descuentoTotal, 
          tipo: 'combinado', 
          detalle: `${getBundleLabel(cuponAplicado.tipoBundle!)} + ${cuponAplicado.descuento}%`,
          productosAplicables: cantidadElegible
        };
      } else {
        // Sin combinable: aplicar el mejor beneficio
        if (bundleResult.descuento >= descuentoPorcentaje) {
          return { 
            descuento: bundleResult.descuento, 
            tipo: 'bundle', 
            detalle: `Promoción ${getBundleLabel(cuponAplicado.tipoBundle!)} (mejor beneficio)`,
            productosAplicables: cantidadElegible
          };
        } else {
          return { 
            descuento: descuentoPorcentaje, 
            tipo: 'porcentaje', 
            detalle: `${cuponAplicado.descuento}% de descuento (mejor beneficio)`,
            productosAplicables: cantidadElegible
          };
        }
      }
    }

    return { descuento: 0, tipo: null, detalle: '', productosAplicables: 0 };
  }, [cuponAplicado, items, promocionesProductos, liquidacionesProductos]);

  const descuentoCupon = descuentoCuponInfo.descuento;
  
  const total = Math.max(0, subtotal - descuentosPromociones.total - descuentoCupon);

  useEffect(() => {
    const cargarCuponesExclusivos = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const response = await axios.get('/my/perfil/beneficios-exclusivos');
        if (response.data.cupones) {
          const cuponesValidos = response.data.cupones.filter((cupon: any) => {
            const ahora = new Date();
            const vigente = (!cupon.fechaFin || new Date(cupon.fechaFin) > ahora) &&
                           (!cupon.fechaInicio || new Date(cupon.fechaInicio) <= ahora);
            return cupon.activo && vigente;
          });
          setCuponesDisponibles(cuponesValidos);
        }
      } catch (error) {
        console.error('Error al cargar cupones exclusivos:', error);
      }
    };

    cargarCuponesExclusivos();
  }, [isAuthenticated, user]);

  const aplicarCupon = async () => {
    if (!codigoCupon.trim()) {
      alert('Por favor ingresa un código de cupón');
      return;
    }

    // Verificar si los códigos están disponibles
    if (!disponibilidadCodigos.disponible) {
      alert(disponibilidadCodigos.razon || 'Los códigos promocionales no están disponibles para este carrito.');
      return;
    }

    try {
      setValidandoCupon(true);
      // Pasar los IDs de productos para validación adicional en el servidor
      const productIds = items.map(item => item.producto.id).join(',');
      const response = await axios.get(`/cms/cupones/validar/${codigoCupon.toUpperCase().trim()}?productIds=${productIds}`);

      // Verificar si el código está bloqueado
      if (response.data.promo_code_available === false) {
        alert(response.data.error || 'Este código no puede ser usado con los productos en tu carrito.');
        return;
      }

      setCupon({
        codigo: response.data.codigo,
        descuento: response.data.descuento,
        tipoDescuento: response.data.tipoDescuento,
        tipoBundle: response.data.tipoBundle,
        combinable: response.data.combinable,
        descripcion: response.data.descripcion
      });
      
      // Generar mensaje de descuento según el tipo
      let descuentoTexto = '';
      if (response.data.tipoBundle && !response.data.descuento) {
        // Solo bundle
        descuentoTexto = getBundleLabel(response.data.tipoBundle);
      } else if (response.data.descuento && !response.data.tipoBundle) {
        // Solo porcentaje
        descuentoTexto = response.data.tipoDescuento === 'PORCENTAJE' 
          ? `${response.data.descuento}%`
          : formatPrice(response.data.descuento);
      } else if (response.data.descuento && response.data.tipoBundle) {
        // Ambos
        descuentoTexto = response.data.combinable 
          ? `${getBundleLabel(response.data.tipoBundle)} + ${response.data.descuento}%`
          : `${getBundleLabel(response.data.tipoBundle)} o ${response.data.descuento}%`;
      }
      alert(`¡Cupón aplicado! ${descuentoTexto} de descuento`);
    } catch (error: any) {
      console.error('Error al validar cupón:', error);
      const mensaje = error.response?.data?.error || 'Cupón inválido o expirado';
      alert(mensaje);
      removeCupon();
    } finally {
      setValidandoCupon(false);
    }
  };

  const removerCupon = () => {
    removeCupon();
    setCodigoCupon('');
  };

  const procederAlPago = () => {
    if (items.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-16 mt-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-light rounded-full flex items-center justify-center">
            <ShoppingCart size={64} className="text-gray" />
          </div>
          <h1 className="text-3xl font-bold text-dark mb-4">Tu carrito está vacío</h1>
          <p className="text-gray mb-8">
            Descubrí nuestra colección de calzado femenino y comenzá a comprar
          </p>
          <Button onClick={() => router.push('/tienda')}>
            Ir a la tienda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8 mt-16">
        <h1 className="text-3xl font-bold text-dark flex items-center gap-3">
          <ShoppingCart className="text-primary" size={32} />
          Mi Carrito ({getTotalItems()} {getTotalItems() === 1 ? 'producto' : 'productos'})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const primeraImagen = item.producto.imagenes?.[0];
            const imagenUrl = typeof primeraImagen === 'string' 
              ? primeraImagen 
              : primeraImagen?.url || '/placeholder-product.jpg';
            const promoItem = promocionesProductos[item.producto.id];
            const liquidacionItem = liquidacionesProductos[item.producto.id];
            
            return (
              <div key={`${item.producto.id}-${item.talle}`} className="card p-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={imagenUrl}
                      alt={item.producto.nombre}
                      fill
                      className="object-cover"
                    />
                    {promoItem && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
                        {promoItem.tipoDescuento === 'DOS_POR_UNO' ? '2x1' : `${promoItem.valorDescuento}% OFF`}
                      </div>
                    )}
                    {!promoItem && liquidacionItem && (
                      <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-br-lg">
                        {liquidacionItem.porcentaje}% OFF
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link
                      href={getProductUrl(item.producto)}
                      className="font-semibold text-dark hover:text-primary transition-colors line-clamp-2"
                    >
                      {item.producto.nombre}
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-gray mt-1">
                      <span>Talle: {item.talle}</span>
                      {item.color && <span>Color: {item.color}</span>}
                    </div>
                    {promoItem && (
                      <div className="flex items-center gap-2 mt-1">
                        <Sparkles size={14} className="text-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          {promoItem.leyendaPersonalizada || promoItem.titulo}
                        </span>
                      </div>
                    )}
                    {!promoItem && liquidacionItem && (
                      <div className="flex items-center gap-2 mt-1">
                        <Tag size={14} className="text-red-500" />
                        <span className="text-xs text-red-600 font-medium">
                          Liquidación - {liquidacionItem.porcentaje}% de descuento
                        </span>
                      </div>
                    )}
                    <p className="text-lg font-bold text-dark mt-2">
                      {formatPrice(item.precioUnitario)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.producto.id, item.talle)}
                      className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.producto.id, item.talle, item.cantidad - 1)}
                        className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary flex items-center justify-center transition-colors"
                        disabled={item.cantidad <= 1}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.producto.id, item.talle, item.cantidad + 1)}
                        className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary flex items-center justify-center transition-colors"
                        disabled={item.cantidad >= item.producto.stock}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="text-lg font-bold text-primary">
                      {formatPrice(item.precioUnitario * item.cantidad)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={clearCart}
            className="text-error hover:underline text-sm flex items-center gap-1"
          >
            <Trash2 size={16} />
            Vaciar carrito
          </button>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="text-xl font-bold text-dark">Resumen de Compra</h2>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Código de Cupón
              </label>
              
              {/* Información sobre política de cupones */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>ℹ️ Regla importante:</strong> Los códigos promocionales <strong>NO se combinan</strong> con promociones especiales ni con productos en liquidación. Solo puedes usar un código por carrito.
                </p>
              </div>
              
              {isAuthenticated && cuponesDisponibles.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setMostrarCupones(!mostrarCupones)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Gift size={14} />
                    {mostrarCupones ? 'Ocultar' : 'Ver'} tus cupones exclusivos ({cuponesDisponibles.length})
                  </button>
                  
                  {mostrarCupones && (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {cuponesDisponibles.map((cupon) => (
                        <div
                          key={cupon.id}
                          className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setCodigoCupon(cupon.codigo);
                            setMostrarCupones(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-bold text-purple-700">{cupon.codigo}</p>
                              <p className="text-xs text-gray-600">{cupon.descripcion}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-accent">
                                {cupon.tipoDescuento === 'PORCENTAJE' 
                                  ? `${cupon.descuento}%` 
                                  : formatPrice(cupon.descuento)}
                              </p>
                              <p className="text-xs text-gray-500">descuento</p>
                            </div>
                          </div>
                          {cupon.fechaFin && (
                            <p className="text-xs text-gray-500 mt-1">
                              Válido hasta: {new Date(cupon.fechaFin).toLocaleDateString('es-AR')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Información si hay productos con promoción - el cupón solo aplicará a productos sin promoción */}
              {(disponibilidadCodigos.promocionBloqueante || disponibilidadCodigos.liquidacionBloqueante) && !cuponAplicado && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-700 mb-1">
                        ℹ️ Información sobre tu carrito
                      </p>
                      <p className="text-xs text-amber-600 mb-2">
                        Algunos productos tienen promociones activas o están en liquidación. 
                        El cupón solo aplicará a productos <strong>sin promoción vigente</strong>.
                      </p>
                      <div className="bg-white bg-opacity-60 p-2 rounded border border-amber-200">
                        <p className="text-xs text-amber-800 font-medium">
                          📋 Política de promociones:
                        </p>
                        <ul className="text-xs text-amber-700 mt-1 space-y-0.5 ml-4">
                          <li>• Los cupones NO se combinan con promociones especiales</li>
                          <li>• Los cupones aplican solo a productos sin promoción</li>
                          <li>• Solo puedes usar UN código por carrito</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codigoCupon}
                  onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                  placeholder="PASO10"
                  disabled={!!cuponAplicado}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {cuponAplicado ? (
                  <button
                    onClick={removerCupon}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Quitar
                  </button>
                ) : (
                  <button
                    onClick={aplicarCupon}
                    disabled={validandoCupon}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Tag size={16} />
                    {validandoCupon ? 'Validando...' : 'Aplicar'}
                  </button>
                )}
              </div>
              
              {cuponAplicado && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Cupón {cuponAplicado.codigo} aplicado
                  </p>
                  {cuponAplicado.descripcion && (
                    <p className="text-xs text-green-600 mt-1">
                      {cuponAplicado.descripcion}
                    </p>
                  )}
                  {descuentoCuponInfo.productosAplicables === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Este cupón no aplica a productos con promoción vigente. Agrega productos sin promoción para usar tu cupón.
                    </p>
                  )}
                  {descuentoCuponInfo.productosAplicables > 0 && descuentosPromociones.total > 0 && (
                    <p className="text-xs text-blue-600 mt-1">
                      ℹ️ Aplicable a {descuentoCuponInfo.productosAplicables} producto(s) sin promoción
                    </p>
                  )}
                </div>
              )}
            </div>

            <hr />

            <div className="space-y-3">
              <div className="flex justify-between text-gray">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {descuentosPromociones.total > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <Sparkles size={16} />
                    <span>Descuentos por Promociones</span>
                  </div>
                  {descuentosPromociones.detalles.map((detalle, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-green-600">
                      <span className="truncate mr-2">{detalle.producto} ({detalle.tipo})</span>
                      <span className="whitespace-nowrap">-{formatPrice(detalle.descuento)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-green-700 pt-1 border-t border-green-200">
                    <span>Total promociones</span>
                    <span>-{formatPrice(descuentosPromociones.total)}</span>
                  </div>
                </div>
              )}

              {cuponAplicado && descuentoCupon > 0 && (
                <div className="flex justify-between text-success">
                  <span>
                    Cupón {cuponAplicado.codigo}
                    {descuentoCuponInfo.detalle && ` (${descuentoCuponInfo.detalle})`}
                  </span>
                  <span>-{formatPrice(descuentoCupon)}</span>
                </div>
              )}

              {cuponAplicado && descuentoCupon === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
                  <p className="font-medium">⚠️ Cupón {cuponAplicado.codigo} aplicado pero sin descuento</p>
                  <p>Todos los productos tienen promoción vigente. Agrega productos sin promoción para usar tu cupón.</p>
                </div>
              )}

              <hr />

              <div className="flex justify-between text-xl font-bold text-dark">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <p className="text-xs text-gray text-center">
                💳 Hasta 12 cuotas sin interés de {formatPrice(total / 12)}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={procederAlPago} fullWidth size="lg">
                Proceder al Pago
                <ChevronRight size={20} />
              </Button>
              
              <Button
                onClick={() => router.push('/tienda')}
                variant="outline"
                fullWidth
              >
                Seguir Comprando
              </Button>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg text-sm">
              <p className="font-medium text-dark mb-1">🚚 Envío a todo el país</p>
              <p className="text-gray">
                Un representante te contactará para coordinar el envío tras confirmar tu pedido.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
