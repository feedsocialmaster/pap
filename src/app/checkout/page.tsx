'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  CheckCircle, 
  ChevronLeft,
  AlertCircle,
  Sparkles,
  Tag
} from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { withClientAuth } from '@/components/auth/withClientAuth';
import { formatPrice } from '@/utils/format';
import axios from '@/lib/axios';

interface PromocionInfo {
  id: string;
  titulo: string;
  tipoDescuento: 'PORCENTAJE' | 'DOS_POR_UNO';
  valorDescuento: number;
  leyendaPersonalizada?: string;
}

const checkoutSchema = z.object({
  // Datos personales (para usuarios no registrados)
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  
  // Dirección de envío
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  provincia: z.string().optional(),
  codigoPostal: z.string().optional(),
  
  // Tipo de entrega
  fulfillmentType: z.enum(['shipping', 'pickup']).optional(),
  
  // Método de pago
  metodoPago: z.enum(['tarjeta', 'transferencia', 'efectivo']).optional(),
  
  // Datos de tarjeta (condicional)
  numeroTarjeta: z.string().optional(),
  nombreTitular: z.string().optional(),
  vencimiento: z.string().optional(),
  cvv: z.string().optional(),
  cuotas: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Definición de sucursales
const SUCURSALES = {
  CENTRAL: {
    id: 'SUCURSAL_CENTRAL',
    nombre: 'Sucursal Central',
    direccion: 'Av. San Martín 1385, Ciudad de Mendoza, Mendoza, Argentina',
  },
  SECUNDARIA: {
    id: 'SUCURSAL_SECUNDARIA',
    nombre: 'Sucursal Secundaria',
    direccion: 'Av. Las Heras 300, Ciudad de Mendoza, Mendoza, Argentina',
  },
} as const;

export default withClientAuth(function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, clearCart, cuponAplicado, removeCupon } = useCartStore();
  const { isAuthenticated, user, syncUserProfile, logout } = useAuthStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<'shipping' | 'pickup'>('shipping');
  const [selectedSucursal, setSelectedSucursal] = useState<string>(SUCURSALES.CENTRAL.id);
  const [userValidated, setUserValidated] = useState(false);
  const [promocionesProductos, setPromocionesProductos] = useState<Record<string, PromocionInfo | null>>({});
  const [liquidacionesProductos, setLiquidacionesProductos] = useState<Record<string, { porcentaje: number } | null>>({});

  // Cargar promociones y liquidaciones para productos del carrito
  // IMPORTANTE: Consulta SIEMPRE la API para obtener datos actualizados
  // (los datos del carrito pueden estar desactualizados si la promoción se configuró después de agregar el producto)
  useEffect(() => {
    const cargarPromocionesProductos = async () => {
      if (items.length === 0) return;
      
      console.log('🎯 [Checkout] Cargando promociones y liquidaciones actualizadas para TODOS los productos del carrito...');
      console.log(`🎯 [Checkout] Total de productos en carrito: ${items.length}`);

      const promociones: Record<string, PromocionInfo | null> = {};
      const liquidaciones: Record<string, { porcentaje: number } | null> = {};
      
      // Consultar TODOS los productos para obtener información actualizada de promociones
      // No confiar en los datos del carrito (pueden estar desactualizados)
      for (const item of items) {
        try {
          console.log(`🔍 [Checkout] Consultando producto ${item.producto.id} (${item.producto.nombre})...`);
          const response = await axios.get(`/products/${item.producto.id}`);
          const productData = response.data.data;
          
          // Capturar promociones activas
          if (productData?.promocionActiva) {
            promociones[item.producto.id] = productData.promocionActiva;
            console.log(`✅ [Checkout] Promoción encontrada para ${item.producto.nombre}:`, productData.promocionActiva);
          } else {
            console.log(`ℹ️ [Checkout] Sin promoción activa para ${item.producto.nombre}`);
          }
          
          // Capturar liquidaciones (tienen prioridad si no hay promoción activa)
          if (productData?.enLiquidacion && productData?.porcentajeDescuento && !productData?.promocionActiva) {
            liquidaciones[item.producto.id] = { porcentaje: productData.porcentajeDescuento };
            console.log(`🔥 [Checkout] Liquidación encontrada para ${item.producto.nombre}: ${productData.porcentajeDescuento}% OFF`);
          }
        } catch (error) {
          console.error(`❌ [Checkout] Error al cargar promoción/liquidación para ${item.producto.id}:`, error);
        }
      }
      
      console.log(`🎯 [Checkout] Promociones cargadas: ${Object.keys(promociones).length} de ${items.length} productos`);
      console.log(`🎯 [Checkout] Liquidaciones cargadas: ${Object.keys(liquidaciones).length} de ${items.length} productos`);
      setPromocionesProductos(promociones);
      setLiquidacionesProductos(liquidaciones);
    };

    if (items.length > 0) {
      cargarPromocionesProductos();
    }
  }, [items]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CheckoutFormData>({
    mode: 'onSubmit',
    defaultValues: {
      nombre: user?.nombre || '',
      apellido: user?.apellido || '',
      email: user?.email || '',
      telefono: user?.telefono || '',
      direccion: user?.direccion?.calle || '',
      ciudad: user?.direccion?.ciudad || '',
      provincia: user?.direccion?.provincia || '',
      codigoPostal: user?.direccion?.codigoPostal || '',
      fulfillmentType: 'shipping',
      metodoPago: 'tarjeta',
      cuotas: '1',
    },
  });

  const metodoPago = watch('metodoPago');
  const cuotasActuales = watch('cuotas');
  
  // DEBUG: Log para ver cambios en cuotas
  console.log('🔍 [Checkout] Estado actual del formulario - metodoPago:', metodoPago, 'cuotas:', cuotasActuales);
  
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

  // Helper para calcular descuento de bundle
  const calcularDescuentoBundle = (
    tipoBundle: string,
    cantidad: number,
    precioUnitario: number
  ): { montoPagado: number; descuento: number } => {
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
  };

  // Calcular descuento del cupón
  // Calcular descuento del cupón
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
      const labels: Record<string, string> = {
        'DOS_POR_UNO': '2x1',
        'TRES_POR_DOS': '3x2',
        'CUATRO_POR_TRES': '4x3',
        'CINCO_POR_DOS': '5x2',
        'CINCO_POR_TRES': '5x3',
      };
      const bundleLabel = labels[cuponAplicado.tipoBundle!] || cuponAplicado.tipoBundle!;
      return { 
        descuento: bundleResult.descuento, 
        tipo: 'bundle', 
        detalle: `Promoción ${bundleLabel}`,
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

      const labels: Record<string, string> = {
        'DOS_POR_UNO': '2x1',
        'TRES_POR_DOS': '3x2',
        'CUATRO_POR_TRES': '4x3',
        'CINCO_POR_DOS': '5x2',
        'CINCO_POR_TRES': '5x3',
      };
      const bundleLabel = labels[cuponAplicado.tipoBundle!] || cuponAplicado.tipoBundle!;

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
          detalle: `${bundleLabel} + ${cuponAplicado.descuento}%`,
          productosAplicables: cantidadElegible
        };
      } else {
        // Sin combinable: aplicar el mejor beneficio
        if (bundleResult.descuento >= descuentoPorcentaje) {
          return { 
            descuento: bundleResult.descuento, 
            tipo: 'bundle', 
            detalle: `Promoción ${bundleLabel} (mejor beneficio)`,
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
  
  const subtotalConPromociones = subtotal - descuentosPromociones.total - descuentoCupon;
  const envio = subtotalConPromociones >= 25000 ? 0 : 3500;
  const total = subtotalConPromociones + envio;

  // Marcar cuando el cliente está montado
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Validar que el usuario existe en la base de datos al cargar el checkout
  useEffect(() => {
    if (!isClient || !isAuthenticated || !user) return;
    
    const validateUser = async () => {
      try {
        console.log('🔍 [Checkout] Validando usuario en BD...');
        await syncUserProfile();
        setUserValidated(true);
        console.log('✅ [Checkout] Usuario validado correctamente');
      } catch (error: any) {
        console.error('❌ [Checkout] Error validando usuario:', error);
        // Solo redirigir si es un error 404 (usuario no encontrado)
        // No redirigir en errores de red u otros errores temporales
        if (error.response?.status === 404) {
          alert('Tu usuario no existe en la base de datos. Por favor, inicia sesión nuevamente.');
          logout();
          router.push('/login?redirect=/checkout');
        } else if (error.response?.status === 401) {
          // Token inválido - axios interceptor ya maneja esto
          console.warn('Token inválido - axios interceptor manejará la redirección');
        } else {
          // Otros errores - continuar pero advertir
          console.warn('No se pudo validar el usuario, pero se continuará con el checkout');
          setUserValidated(true); // Permitir continuar
        }
      }
    };
    
    validateUser();
  }, [isClient, isAuthenticated, user?.id]);

  // Redirigir si el carrito está vacío (solo después de montar cliente)
  useEffect(() => {
    if (!isClient) return;
    if (items.length === 0) {
      router.push('/carrito');
    }
  }, [items, router, isClient]);

  // Redirigir si no está autenticado (solo después de montar cliente y dar tiempo a hidratar)
  useEffect(() => {
    if (!isClient) return;
    
    // Dar tiempo para que el store se hidrate desde localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        alert('Debés iniciar sesión para realizar una compra');
        router.push('/login?redirect=/checkout');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router, isClient]);

  // Manejar retorno de Mercado Pago
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const orderId = params.get('orderId');
    if (status === 'approved' && orderId) {
      alert('¡Pago aprobado! Gracias por tu compra.');
      router.push('/mis-compras');
    }
  }, [router]);

  const onSubmit = async (data: CheckoutFormData) => {
    // Obtener valores actuales del formulario
    const formValues = watch();
    
    console.log('🔍 DEBUG - Paso actual:', step);
    console.log('🔍 DEBUG - Valores del formulario:', formValues);
    
    // PASO 1: Validar datos de envío
    if (step === 1) {
      // Solo validar dirección si es envío a domicilio
      if (fulfillmentType === 'shipping') {
        const { direccion, ciudad, provincia, codigoPostal } = formValues;
        
        if (!direccion || !ciudad || !provincia || !codigoPostal) {
          alert('Por favor completá todos los campos de dirección de envío');
          return;
        }
        if (direccion.trim().length < 5) {
          alert('La dirección debe tener al menos 5 caracteres');
          return;
        }
        if (ciudad.trim().length < 2) {
          alert('La ciudad debe tener al menos 2 caracteres');
          return;
        }
        if (provincia === '' || provincia === 'Seleccionar provincia') {
          alert('Por favor seleccioná una provincia');
          return;
        }
        if (codigoPostal.trim().length < 4) {
          alert('El código postal debe tener al menos 4 caracteres');
          return;
        }
      }
      setStep(2);
      return;
    }

    // PASO 2: Validar método de pago
    if (step === 2) {
      const { metodoPago, numeroTarjeta, nombreTitular, vencimiento, cvv } = formValues;
      
      if (!metodoPago) {
        alert('Por favor seleccioná un método de pago');
        return;
      }
      
      // Si eligió tarjeta, validar datos de la tarjeta
      if (metodoPago === 'tarjeta') {
        if (!numeroTarjeta || !nombreTitular || !vencimiento || !cvv) {
          alert('Por favor completá todos los datos de la tarjeta');
          return;
        }
        // Validar formato de número de tarjeta (16 dígitos con espacios)
        const numeroLimpio = numeroTarjeta.replace(/\s/g, '');
        if (numeroLimpio.length < 15 || numeroLimpio.length > 16) {
          alert('El número de tarjeta debe tener 15 o 16 dígitos');
          return;
        }
        if (nombreTitular.trim().length < 3) {
          alert('El nombre del titular debe tener al menos 3 caracteres');
          return;
        }
        // Validar formato de vencimiento MM/AA
        if (!/^\d{2}\/\d{2}$/.test(vencimiento)) {
          alert('El vencimiento debe tener formato MM/AA');
          return;
        }
        if (cvv.length < 3 || cvv.length > 4) {
          alert('El CVV debe tener 3 o 4 dígitos');
          return;
        }
      }
      
      setStep(3);
      return;
    }

    // PASO 3: Confirmar y procesar el pago
    if (step === 3) {
      // Validar que el usuario esté autenticado
      if (!isAuthenticated || !user?.id) {
        alert('Debés iniciar sesión para completar la compra');
        router.push('/login?redirect=/checkout');
        return;
      }
      
      // Verificar que el usuario esté activo (solo si el campo existe)
      if (user.activo === false) {
        alert('Tu cuenta está inactiva. Por favor verifica tu email o contacta a soporte.');
        return;
      }

      setIsProcessing(true);
      try {
        // Construir dirección de envío solo si es shipping
        const direccionEnvio = fulfillmentType === 'shipping' 
          ? {
              calle: data.direccion || '',
              ciudad: data.ciudad || '',
              provincia: data.provincia || '',
              codigoPostal: data.codigoPostal || '',
            }
          : null;
        
        // IMPORTANTE: Cargar promociones actualizadas ANTES de crear el pedido
        // No confiar en el estado promocionesProductos que puede estar desactualizado
        console.log('🔄 [Checkout] Cargando promociones actualizadas antes de crear pedido...');
        const promocionesActualizadas: Record<string, PromocionInfo | null> = {};
        
        for (const item of items) {
          try {
            const response = await axios.get(`/products/${item.producto.id}`);
            const productData = response.data.data;
            
            if (productData?.promocionActiva) {
              promocionesActualizadas[item.producto.id] = productData.promocionActiva;
              console.log(`✅ [Checkout] Promoción encontrada para ${item.producto.nombre}:`, productData.promocionActiva);
            }
          } catch (error) {
            console.error(`❌ [Checkout] Error cargando promoción para ${item.producto.id}:`, error);
          }
        }
          
        // Construir items para el backend con precios ya con descuentos aplicados
        // Obtener valores actuales del formulario via watch() para asegurar datos frescos
        const currentFormValues = watch();
        
        // DEBUG: Log para verificar datos del formulario
        console.log('🔍 [Checkout] Datos de cuotas del formulario:', {
          dataMetodoPago: data.metodoPago,
          dataCuotas: data.cuotas,
          watchMetodoPago: currentFormValues.metodoPago,
          watchCuotas: currentFormValues.cuotas,
        });
        
        // Usar watch() para obtener el valor actual de cuotas (más confiable)
        const cuotasSeleccionadas = currentFormValues.metodoPago === 'tarjeta' 
          ? parseInt(currentFormValues.cuotas || '1', 10) 
          : 1;
        
        console.log('🔍 [Checkout] Cuotas a enviar:', cuotasSeleccionadas);
        
        const payload = {
          usuarioId: user.id,
          direccionEnvio,
          fulfillmentType,
          pickupLocationId: fulfillmentType === 'pickup' ? selectedSucursal : undefined,
          paymentMethodDetail: currentFormValues.metodoPago || 'mercadopago',
          // Enviar cuotas seleccionadas si el método es tarjeta
          installments: cuotasSeleccionadas,
          items: items.map((it) => {
            // Usar promociones recién cargadas, no el estado que puede estar desactualizado
            const promo = promocionesActualizadas[it.producto.id];
            let precioConDescuento = it.precioUnitario;
            
            console.log(`💰 [Checkout] Procesando item: ${it.producto.nombre}`);
            console.log(`💰 [Checkout] Precio original: $${it.precioUnitario}`);
            console.log(`💰 [Checkout] Tiene promoción:`, !!promo);
            
            // Aplicar descuento de promoción si existe
            if (promo) {
              if (promo.tipoDescuento === 'PORCENTAJE') {
                precioConDescuento = Math.round(it.precioUnitario * (1 - promo.valorDescuento / 100));
                console.log(`💰 [Checkout] Aplicando descuento ${promo.valorDescuento}%: $${precioConDescuento}`);
              } else if (promo.tipoDescuento === 'DOS_POR_UNO') {
                // Para 2x1, ajustamos el precio unitario para que el total sea correcto
                const itemsGratis = Math.floor(it.cantidad / 2);
                const precioTotal = it.precioUnitario * (it.cantidad - itemsGratis);
                precioConDescuento = Math.round(precioTotal / it.cantidad);
                console.log(`💰 [Checkout] Aplicando 2x1 (${itemsGratis} gratis): $${precioConDescuento}`);
              }
            } else {
              console.log(`💰 [Checkout] Sin promoción, usando precio original`);
            }
            
            return {
              productId: it.producto.id,
              cantidad: it.cantidad,
              talle: it.talle,
              ...(it.color ? { color: it.color } : {}),
              precioConDescuento, // Enviar precio con promoción aplicada
            };
          }),
          // Información del cupón aplicado
          cuponAplicado: cuponAplicado ? {
            codigo: cuponAplicado.codigo,
            descuento: cuponAplicado.descuento,
            tipoDescuento: cuponAplicado.tipoDescuento,
            tipoBundle: cuponAplicado.tipoBundle,
            combinable: cuponAplicado.combinable,
          } : null,
        };
        
        console.log('🛒 [Checkout] Usuario ID:', user.id);
        console.log('🛒 [Checkout] Usuario completo:', JSON.stringify(user, null, 2));
        console.log('🛒 [Checkout] Token en localStorage:', localStorage.getItem('auth-storage'));
        console.log('🛒 [Checkout] Payload:', JSON.stringify(payload, null, 2));
        
        const res = await axios.post('/payments/create-preference', payload);
        const initPoint = res.data?.data?.init_point;
        const orderId = res.data?.data?.order?.id;
        
        if (initPoint) {
          // Limpiar carrito ANTES de redirigir al pago
          clearCart();
          
          // Store order ID in sessionStorage for confirmation page
          if (orderId) {
            sessionStorage.setItem('lastOrderId', orderId);
          }
          
          window.location.href = initPoint;
        } else {
          throw new Error('No se pudo iniciar el pago');
        }
      } catch (err: any) {
        console.error('❌ Error al crear preferencia de pago:', err);
        console.error('❌ Respuesta del servidor:', err.response?.data);
        console.error('❌ Status:', err.response?.status);
        console.error('❌ Headers:', err.response?.headers);
        console.error('❌ Usuario ID que causó el error:', user.id);
        
        const errorMsg = err.response?.data?.error || err.message || 'Error al procesar el pago. Intentá nuevamente.';
        const detailMsg = err.response?.data?.details || '';
        const errorType = err.response?.data?.errorType;
        
        // Solo mostrar mensaje de cerrar sesión si el error es de autenticación
        let actionMsg = '';
        if (errorType === 'auth') {
          actionMsg = '\n\nPor favor, intentá cerrar sesión y volver a iniciar sesión.';
        } else if (errorType === 'payment_config') {
          actionMsg = '\n\nPor favor, contacta al soporte del sitio.';
        }
        
        alert(`Error: ${errorMsg}${detailMsg ? '\n\nDetalles: ' + detailMsg : ''}${actionMsg}`);
        setIsProcessing(false);
      }
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-light py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 mt-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray hover:text-primary mb-4"
          >
            <ChevronLeft size={20} />
            Volver al carrito
          </button>
          <h1 className="text-3xl font-bold text-dark">Finalizar Compra</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Coordinar Entrega' },
              { num: 2, label: 'Método de Pago' },
              { num: 3, label: 'Confirmar Pago' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      step >= s.num
                        ? 'bg-primary text-white'
                        : 'bg-gray-300 text-gray'
                    }`}
                  >
                    {step > s.num ? <CheckCircle size={20} /> : s.num}
                  </div>
                  <span className="text-sm mt-2 text-gray">{s.label}</span>
                </div>
                {idx < 2 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      step > s.num ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* PASO 1: Datos de Envío */}
              {step === 1 && (
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Truck className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-dark">Datos de Envío</h2>
                  </div>

                  {!isAuthenticated && (
                    <>
                      <h3 className="font-medium text-dark mb-4">Información Personal</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-dark mb-2">
                            Nombre *
                          </label>
                          <input
                            {...register('nombre')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                              errors.nombre ? 'border-error' : 'border-gray-light'
                            }`}
                          />
                          {errors.nombre && (
                            <p className="text-error text-sm mt-1">{errors.nombre.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark mb-2">
                            Apellido *
                          </label>
                          <input
                            {...register('apellido')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                              errors.apellido ? 'border-error' : 'border-gray-light'
                            }`}
                          />
                          {errors.apellido && (
                            <p className="text-error text-sm mt-1">{errors.apellido.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            {...register('email')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                              errors.email ? 'border-error' : 'border-gray-light'
                            }`}
                          />
                          {errors.email && (
                            <p className="text-error text-sm mt-1">{errors.email.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark mb-2">
                            Teléfono *
                          </label>
                          <input
                            {...register('telefono')}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                              errors.telefono ? 'border-error' : 'border-gray-light'
                            }`}
                          />
                          {errors.telefono && (
                            <p className="text-error text-sm mt-1">{errors.telefono.message}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Tipo de Entrega */}
                  <div className="mb-6">
                    <h3 className="font-medium text-dark mb-4">Tipo de Entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('shipping')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          fulfillmentType === 'shipping'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-light hover:border-primary/50'
                        }`}
                      >
                        <Truck className={`mb-2 ${fulfillmentType === 'shipping' ? 'text-primary' : 'text-gray'}`} size={24} />
                        <h4 className="font-medium text-dark mb-1">Envío a domicilio</h4>
                        <p className="text-sm text-gray">Recibí tu pedido en la puerta de tu casa</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('pickup')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          fulfillmentType === 'pickup'
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-light hover:border-primary/50'
                        }`}
                      >
                        <MapPin className={`mb-2 ${fulfillmentType === 'pickup' ? 'text-primary' : 'text-gray'}`} size={24} />
                        <h4 className="font-medium text-dark mb-1">Retiro en local</h4>
                        <p className="text-sm text-gray">Retirá tu pedido sin costo de envío</p>
                      </button>
                    </div>
                  </div>

                  {fulfillmentType === 'shipping' && (
                    <>
                      <h3 className="font-medium text-dark mb-4">Dirección de Entrega</h3>
                      <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        Dirección *
                      </label>
                      <input
                        {...register('direccion')}
                        placeholder="Calle y número"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                          errors.direccion ? 'border-error' : 'border-gray-light'
                        }`}
                      />
                      {errors.direccion && (
                        <p className="text-error text-sm mt-1">{errors.direccion.message}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Ciudad *
                        </label>
                        <input
                          {...register('ciudad')}
                          onChange={(e) => {
                            // Solo letras, espacios y acentos
                            const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                            e.target.value = value;
                            setValue('ciudad', value);
                          }}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                            errors.ciudad ? 'border-error' : 'border-gray-light'
                          }`}
                        />
                        {errors.ciudad && (
                          <p className="text-error text-sm mt-1">{errors.ciudad.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Provincia *
                        </label>
                        <select
                          {...register('provincia')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                            errors.provincia ? 'border-error' : 'border-gray-light'
                          }`}
                        >
                          <option value="">Seleccionar provincia</option>
                          <option value="Buenos Aires">Buenos Aires</option>
                          <option value="CABA">Ciudad Autónoma de Buenos Aires</option>
                          <option value="Catamarca">Catamarca</option>
                          <option value="Chaco">Chaco</option>
                          <option value="Chubut">Chubut</option>
                          <option value="Córdoba">Córdoba</option>
                          <option value="Corrientes">Corrientes</option>
                          <option value="Entre Ríos">Entre Ríos</option>
                          <option value="Formosa">Formosa</option>
                          <option value="Jujuy">Jujuy</option>
                          <option value="La Pampa">La Pampa</option>
                          <option value="La Rioja">La Rioja</option>
                          <option value="Mendoza">Mendoza</option>
                          <option value="Misiones">Misiones</option>
                          <option value="Neuquén">Neuquén</option>
                          <option value="Río Negro">Río Negro</option>
                          <option value="Salta">Salta</option>
                          <option value="San Juan">San Juan</option>
                          <option value="San Luis">San Luis</option>
                          <option value="Santa Cruz">Santa Cruz</option>
                          <option value="Santa Fe">Santa Fe</option>
                          <option value="Santiago del Estero">Santiago del Estero</option>
                          <option value="Tierra del Fuego">Tierra del Fuego</option>
                          <option value="Tucumán">Tucumán</option>
                        </select>
                        {errors.provincia && (
                          <p className="text-error text-sm mt-1">{errors.provincia.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Código Postal *
                        </label>
                        <input
                          {...register('codigoPostal')}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                            errors.codigoPostal ? 'border-error' : 'border-gray-light'
                          }`}
                        />
                        {errors.codigoPostal && (
                          <p className="text-error text-sm mt-1">{errors.codigoPostal.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  </>
                  )}
                  
                  {fulfillmentType === 'pickup' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-4">📍 Seleccioná donde querés retirar tu pedido</h4>
                      
                      <div className="space-y-3 mb-4">
                        {/* Sucursal Central */}
                        <label
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedSucursal === SUCURSALES.CENTRAL.id
                              ? 'border-primary bg-green-100/50'
                              : 'border-green-300 hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="sucursal"
                            value={SUCURSALES.CENTRAL.id}
                            checked={selectedSucursal === SUCURSALES.CENTRAL.id}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="mt-1 mr-3 text-primary focus:ring-primary"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-green-800">{SUCURSALES.CENTRAL.nombre}</p>
                            <p className="text-sm text-green-700 mt-1">{SUCURSALES.CENTRAL.direccion}</p>
                          </div>
                        </label>

                        {/* Sucursal Secundaria */}
                        <label
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedSucursal === SUCURSALES.SECUNDARIA.id
                              ? 'border-primary bg-green-100/50'
                              : 'border-green-300 hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="sucursal"
                            value={SUCURSALES.SECUNDARIA.id}
                            checked={selectedSucursal === SUCURSALES.SECUNDARIA.id}
                            onChange={(e) => setSelectedSucursal(e.target.value)}
                            className="mt-1 mr-3 text-primary focus:ring-primary"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-green-800">{SUCURSALES.SECUNDARIA.nombre}</p>
                            <p className="text-sm text-green-700 mt-1">{SUCURSALES.SECUNDARIA.direccion}</p>
                          </div>
                        </label>
                      </div>

                      <div className="border-t border-green-200 pt-3 mb-3">
                        <p className="text-sm text-green-700">
                          <strong>Horarios de atención en ambas sucursales:</strong><br />
                          Lun - Vie: 09:30 - 21:00 hs<br />
                          Sábados: 09:00 - 21:00 hs
                        </p>
                      </div>

                      <p className="text-sm text-green-700">
                        💡 Recibirás un email cuando tu pedido esté listo para retirar.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <Truck className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm text-blue-800">
                        {fulfillmentType === 'shipping' ? (
                          <>
                            <strong>Tiempo de entrega:</strong> Gran Mendoza y alrededores: Dentro de las 24-48hs al confirmar el pago. Envíos a otras provincias argentinas: 5-7 días hábiles.
                          </>
                        ) : (
                          <>
                            <strong>Retiro disponible:</strong> A partir de las 24 hs de confirmado el pago.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: Método de Pago */}
              {step === 2 && (
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-dark">Método de Pago</h2>
                  </div>

                  <div className="space-y-4 mb-6">
                    <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="radio"
                        {...register('metodoPago')}
                        value="tarjeta"
                        className="w-5 h-5 text-primary"
                      />
                      <CreditCard size={24} className="text-gray" />
                      <div>
                        <p className="font-medium text-dark">Tarjeta de Crédito/Débito</p>
                        <p className="text-sm text-gray">Hasta 12 cuotas sin interés</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="radio"
                        {...register('metodoPago')}
                        value="transferencia"
                        className="w-5 h-5 text-primary"
                      />
                      <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">$</span>
                      </div>
                      <div>
                        <p className="font-medium text-dark">Transferencia Bancaria</p>
                      </div>
                    </label>

                    {fulfillmentType === 'pickup' && (
                      <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors">
                        <input
                          type="radio"
                          {...register('metodoPago')}
                          value="efectivo"
                          className="w-5 h-5 text-primary"
                        />
                        <MapPin size={24} className="text-gray" />
                        <div>
                          <p className="font-medium text-dark">Efectivo en Sucursal</p>
                          <p className="text-sm text-gray">Retirá y pagá en el local</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {metodoPago === 'tarjeta' && (
                    <div className="space-y-4 pt-6 border-t border-gray-light">
                      <h3 className="font-medium text-dark mb-4">Datos de la Tarjeta</h3>
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Número de Tarjeta *
                        </label>
                        <input
                          {...register('numeroTarjeta')}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          onChange={(e) => {
                            // Solo números, auto-formatear con espacios cada 4 dígitos
                            const value = e.target.value.replace(/\D/g, '');
                            const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                            e.target.value = formatted;
                            setValue('numeroTarjeta', formatted);
                          }}
                          className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Nombre del Titular *
                        </label>
                        <input
                          {...register('nombreTitular')}
                          placeholder="Como figura en la tarjeta"
                          onChange={(e) => {
                            // Solo letras, espacios y acentos
                            const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase();
                            e.target.value = value;
                            setValue('nombreTitular', value);
                          }}
                          className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-dark mb-2">
                            Vencimiento *
                          </label>
                          <input
                            {...register('vencimiento')}
                            placeholder="MM/AA"
                            maxLength={5}
                            onChange={(e) => {
                              // Solo números, auto-insertar /
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.slice(0, 2) + '/' + value.slice(2, 4);
                              }
                              e.target.value = value;
                              setValue('vencimiento', value);
                            }}
                            className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-dark mb-2">
                            CVV *
                          </label>
                          <input
                            {...register('cvv')}
                            placeholder="123"
                            maxLength={4}
                            onChange={(e) => {
                              // Solo números
                              const value = e.target.value.replace(/\D/g, '');
                              e.target.value = value;
                              setValue('cvv', value);
                            }}
                            className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-primary outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark mb-2">
                          Cuotas
                        </label>
                        <select
                          {...register('cuotas')}
                          value={cuotasActuales}
                          onChange={(e) => {
                            setValue('cuotas', e.target.value);
                            console.log('🔄 [Checkout] Cuotas cambiado a:', e.target.value);
                          }}
                          className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="1">1 pago sin interés</option>
                          <option value="3">3 cuotas sin interés</option>
                          <option value="6">6 cuotas sin interés</option>
                          <option value="9">9 cuotas sin interés</option>
                          <option value="12">12 cuotas sin interés</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {metodoPago === 'transferencia' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Te enviaremos los datos bancarios por email para que realices la transferencia. Recordá que el correo electrónico que hayas colocado en caso de no existir no nos podremos comunicar con vos.
                      </p>
                    </div>
                  )}

                  {metodoPago === 'efectivo' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        Reservaremos tu pedido por 48 horas. Visitá nuestra sucursal para retirarlo y abonar.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 3: Confirmación */}
              {step === 3 && (
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold text-dark">Confirmar Pedido</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Resumen de productos */}
                    <div>
                      <h3 className="font-medium text-dark mb-3">Productos ({items.length})</h3>
                      <div className="space-y-3">
                        {items.map((item) => {
                          // Obtener la primera imagen (puede ser string o objeto)
                          const primeraImagen = item.producto.imagenes?.[0];
                          const imagenUrl = typeof primeraImagen === 'string' 
                            ? primeraImagen 
                            : primeraImagen?.url || '/placeholder-product.jpg';
                          
                          return (
                          <div key={`${item.producto.id}-${item.talle}`} className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-light rounded overflow-hidden flex-shrink-0 relative">
                              <Image
                                src={imagenUrl}
                                alt={item.producto.nombre}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-dark">{item.producto.nombre}</p>
                              <p className="text-sm text-gray">
                                Talle: {item.talle} • Cant: {item.cantidad}
                              </p>
                            </div>
                            <p className="font-medium text-dark">
                              {formatPrice(item.producto.precio * item.cantidad)}
                            </p>
                          </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dirección de envío */}
                    <div className="pt-6 border-t border-gray-light">
                      <h3 className="font-medium text-dark mb-2">Dirección de Envío</h3>
                      <p className="text-gray">
                        {watch('direccion')}<br />
                        {watch('ciudad')}, {watch('provincia')} ({watch('codigoPostal')})
                      </p>
                    </div>

                    {/* Método de pago */}
                    <div className="pt-6 border-t border-gray-light">
                      <h3 className="font-medium text-dark mb-2">Método de Pago</h3>
                      <p className="text-gray">
                        {metodoPago === 'tarjeta' && (
                          <>
                            Tarjeta de Crédito/Débito
                            {cuotasActuales && (
                              <span className="ml-2 text-primary font-medium">
                                ({cuotasActuales === '1' ? '1 pago' : `${cuotasActuales} cuotas`} sin interés)
                              </span>
                            )}
                          </>
                        )}
                        {metodoPago === 'transferencia' && 'Transferencia Bancaria'}
                        {metodoPago === 'efectivo' && 'Efectivo en Sucursal'}
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                      <p className="text-sm text-yellow-800">
                        Al confirmar tu pedido, aceptás nuestros términos y condiciones. 
                        Recibirás un email con el detalle de tu compra.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                      <p className="text-sm text-blue-800">
                        Si tienes preguntas, puedes escribirnos por WhatsApp para una asesoría personalizada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
                    className="btn-outline flex-1"
                    disabled={isProcessing}
                  >
                    Volver
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isProcessing}
                  onClick={(e) => {
                    console.log('🔴 Botón clickeado - Step:', step);
                    console.log('🔴 Form values:', watch());
                  }}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : step === 3 ? (
                    'Confirmar Pedido'
                  ) : (
                    'Continuar'
                  )}
                </button>
              </div>
            </div>

            {/* Resumen del Pedido */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="text-xl font-bold text-dark mb-4">Resumen del Pedido</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray">
                    <span>Subtotal ({items.length} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  {descuentosPromociones.total > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                        <Sparkles size={14} />
                        <span>Descuentos por Promociones</span>
                      </div>
                      {descuentosPromociones.detalles.map((detalle, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-green-600">
                          <span className="truncate mr-2">{detalle.producto} ({detalle.tipo})</span>
                          <span className="whitespace-nowrap">-{formatPrice(detalle.descuento)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-green-700 text-sm pt-1 border-t border-green-200">
                        <span>Total promociones</span>
                        <span>-{formatPrice(descuentosPromociones.total)}</span>
                      </div>
                    </div>
                  )}
                  
                  {cuponAplicado && descuentoCupon > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-purple-700 font-medium text-sm">
                          <Tag size={14} />
                          <span>Cupón {cuponAplicado.codigo}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCupon()}
                          className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="flex justify-between text-sm text-purple-700">
                        <span>{descuentoCuponInfo.detalle}</span>
                        <span className="font-bold">-{formatPrice(descuentoCupon)}</span>
                      </div>
                      {cuponAplicado.descripcion && (
                        <p className="text-xs text-purple-600 mt-1">
                          {cuponAplicado.descripcion}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray">
                    <span>Envío</span>
                    <span>{envio === 0 ? 'Gratis' : formatPrice(envio)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-light">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-dark">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(total)}
                    </span>
                  </div>
                  {metodoPago === 'tarjeta' && watch('cuotas') !== '1' && (
                    <p className="text-sm text-gray text-right">
                      {watch('cuotas')} x {formatPrice(total / parseInt(watch('cuotas') || '1'))}
                    </p>
                  )}
                </div>

                {envio > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      Te faltan {formatPrice(25000 - subtotalConPromociones)} para envío gratis
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-light space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray">
                    <CheckCircle size={16} className="text-success" />
                    <span>Compra 100% segura</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray">
                    <Truck size={16} className="text-success" />
                    <span>Envío con seguimiento</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray">
                    <CheckCircle size={16} className="text-success" />
                    <span>Primer cambio sin cargo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
