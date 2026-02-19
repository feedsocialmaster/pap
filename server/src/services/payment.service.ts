import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
type DbProduct = { id: string; nombre: string; precio: number; enLiquidacion: boolean; porcentajeDescuento: number | null };
import { env } from '../config/env.js';
import { prisma } from '../prisma.js';

// Validar que el token de MP esté configurado correctamente
const isValidMPToken = (token: string): boolean => {
  if (!token || token.length < 20) return false;
  // Verificar que no sea un placeholder
  if (/^TEST-x+$/i.test(token) || /^APP_USR-x+$/i.test(token)) return false;
  // Tokens válidos empiezan con TEST- o APP_USR-
  return token.startsWith('TEST-') || token.startsWith('APP_USR-');
};

const mpTokenValid = isValidMPToken(env.MP_ACCESS_TOKEN);
if (!mpTokenValid) {
  console.warn('⚠️ [Payment Service] TOKEN DE MERCADO PAGO NO CONFIGURADO O INVÁLIDO');
  console.warn('⚠️ [Payment Service] Los pagos NO funcionarán hasta que se configure correctamente en server/.env');
  console.warn('⚠️ [Payment Service] Formato esperado: MP_ACCESS_TOKEN=TEST-xxxxx... o APP_USR-xxxxx...');
}

const mp = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
import type { Prisma } from '@prisma/client';
import { notificationService } from './notifications.service.js';
import { getWebSocketService } from './websocket.service.js';
import { checkUserCanPurchase } from './email-verification.service.js';

/**
 * Verifica si el servicio de pagos está correctamente configurado
 */
export function isPaymentServiceConfigured(): boolean {
  return mpTokenValid;
}

export function isTalleValid(talles: number[] | null | undefined, talle: number) {
  if (!Array.isArray(talles) || talles.length === 0) return true; // si el producto no define talles, no validamos
  return talles.includes(Number(talle));
}

export function isColorValid(colores: any, color: string | undefined) {
  if (!color) return true; // si no se envía color, aceptamos
  if (!colores) return true; // si el producto no define colores, aceptamos
  try {
    if (Array.isArray(colores)) {
      // array de strings
      if (typeof colores[0] === 'string') return (colores as string[]).includes(color);
      // array de objetos con nombre/valor
      if (typeof colores[0] === 'object' && colores[0] !== null) {
        return (colores as Array<Record<string, any>>).some((c) => c?.name === color || c?.nombre === color || c?.value === color);
      }
    }
    // objeto tipo { disponibles: ['Rojo','Azul'] }
    if (typeof colores === 'object' && colores !== null) {
      const vals = (colores.disponibles || colores.values || colores.lista) as any;
      if (Array.isArray(vals)) return vals.includes(color);
    }
  } catch (_e) {
    return true;
  }
  return true; // default permisivo
}

export async function createOrderAndPreference(params: {
  usuarioId: string;
  items: Array<{ 
    productId: string; 
    cantidad: number; 
    talle: number; 
    color?: string;
    precioConDescuento?: number; // Precio con promociones aplicadas desde el frontend
  }>;
  direccionEnvio?: any;
  puntosUsados?: number;
  fulfillmentType?: 'shipping' | 'pickup';
  pickupLocationId?: string;
  paymentMethodDetail?: string;
  installments?: number; // Cuotas seleccionadas (1, 3, 6, 9, 12)
  cuponAplicado?: {
    codigo: string;
    descuento: number | null;
    tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO';
    tipoBundle?: string | null;
    combinable?: boolean;
  } | null;
}) {
  console.log('💳 [Payment Service] Iniciando creación de orden para usuario:', params.usuarioId);
  console.log('💳 [Payment Service] Tipo de usuario ID:', typeof params.usuarioId);
  console.log('💳 [Payment Service] Longitud del usuario ID:', params.usuarioId?.length);
  console.log('🎫 [Payment Service] Cupón aplicado recibido:', JSON.stringify(params.cuponAplicado, null, 2));
  
  // Verificar que el servicio de pagos esté configurado ANTES de crear la orden
  if (!isPaymentServiceConfigured()) {
    console.error('❌ [Payment Service] Token de Mercado Pago no configurado');
    throw new Error('El sistema de pagos no está configurado. Por favor contacte al administrador.');
  }
  
  // Check if user can purchase
  const userCheck = await checkUserCanPurchase(params.usuarioId);
  console.log('💳 [Payment Service] Resultado de verificación de usuario:', userCheck);
  
  if (!userCheck.canPurchase) {
    console.error('❌ [Payment Service] Usuario no puede comprar. ID intentado:', params.usuarioId);
    console.error('❌ [Payment Service] Razón:', userCheck.reason);
    throw new Error(`${userCheck.reason} (ID de usuario: ${params.usuarioId})`);
  }

  // Fetch products con información de promoción
  const productIds = params.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { 
      id: true, 
      nombre: true, 
      precio: true, 
      enLiquidacion: true, 
      porcentajeDescuento: true, 
      stock: true, 
      talles: true, 
      colores: true,
      aplicaPromocion: true,
      tipoPromocionAplica: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p] as const));
  
  // Obtener promociones activas para los productos que aplican
  const ahora = new Date();
  const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
  const finDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
  
  const promocionIds = products
    .filter(p => p.aplicaPromocion && p.tipoPromocionAplica)
    .map(p => p.tipoPromocionAplica as string);
  
  const promocionesActivas = promocionIds.length > 0 
    ? await prisma.cMSPromocion.findMany({
        where: {
          id: { in: promocionIds },
          activo: true,
          fechaInicio: { lte: finDia },
          fechaFin: { gte: inicioDia },
        },
      })
    : [];
  
  const promocionesMap = new Map(promocionesActivas.map(p => [p.id, p]));
  console.log(`🎯 [Payment] Promociones activas encontradas: ${promocionesActivas.length}`);
  promocionesActivas.forEach(p => {
    console.log(`   - ${p.titulo}: ${p.tipoDescuento} ${p.valorDescuento}`);
  });

  // Build order items and totals (prices in cents)
  let subtotal = 0;
  const orderItems = params.items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error('Producto no encontrado');
    // Chequeo de stock al momento de crear preferencia (evita vender sin stock)
    const available = p.stock as number;
    if (available < i.cantidad) {
      throw new Error('Stock insuficiente para uno o más productos');
    }
    if (!isTalleValid(p.talles as number[], i.talle)) {
      throw new Error('Talle no disponible para el producto');
    }
    if (!isColorValid(p.colores, i.color)) {
      throw new Error('Color no disponible para el producto');
    }
    
    // CALCULAR DESCUENTO DIRECTAMENTE EN EL BACKEND
    let precioUnitario = p.precio;
    let descuentoAplicado = 0;
    let promocionId: string | null = null;
    
    // 1. Verificar si el producto tiene promoción activa
    if (p.aplicaPromocion && p.tipoPromocionAplica) {
      const promo = promocionesMap.get(p.tipoPromocionAplica);
      if (promo) {
        promocionId = promo.id;
        if (promo.tipoDescuento === 'PORCENTAJE') {
          descuentoAplicado = Math.round(p.precio * promo.valorDescuento / 100);
          precioUnitario = p.precio - descuentoAplicado;
          console.log(`💰 [Payment] Aplicando promoción "${promo.titulo}" (${promo.valorDescuento}%) a ${p.nombre}: $${p.precio} -> $${precioUnitario}`);
        } else if (promo.tipoDescuento === 'DOS_POR_UNO') {
          // Para 2x1, calcular descuento basado en cantidad
          const itemsGratis = Math.floor(i.cantidad / 2);
          if (itemsGratis > 0) {
            const precioTotal = p.precio * (i.cantidad - itemsGratis);
            precioUnitario = Math.round(precioTotal / i.cantidad);
            descuentoAplicado = p.precio - precioUnitario;
            console.log(`💰 [Payment] Aplicando promoción 2x1 a ${p.nombre}: ${itemsGratis} gratis, precio unitario ajustado: $${precioUnitario}`);
          }
        }
      }
    }
    
    // 2. Si no hay promoción, verificar liquidación
    if (descuentoAplicado === 0 && p.enLiquidacion && p.porcentajeDescuento) {
      descuentoAplicado = Math.round(p.precio * (p.porcentajeDescuento / 100));
      precioUnitario = p.precio - descuentoAplicado;
      console.log(`💰 [Payment] Aplicando liquidación (${p.porcentajeDescuento}%) a ${p.nombre}: $${p.precio} -> $${precioUnitario}`);
    }
    
    // 3. Si el frontend envió un precio diferente, usar el menor (seguridad)
    if (i.precioConDescuento !== undefined && i.precioConDescuento !== null && i.precioConDescuento < precioUnitario) {
      console.log(`⚠️ [Payment] Frontend envió precio menor ($${i.precioConDescuento}) que el calculado ($${precioUnitario}). Usando el calculado por seguridad.`);
      // Mantener el precio calculado por el backend por seguridad
    }
    
    // Obtener nombre de la promoción para mostrar en CMS
    let promocionNombre: string | null = null;
    if (promocionId) {
      const promo = promocionesMap.get(promocionId);
      if (promo) {
        promocionNombre = `${promo.titulo} (${promo.valorDescuento}% OFF)`;
      }
    } else if (descuentoAplicado > 0 && p.enLiquidacion) {
      promocionNombre = `Liquidación (${p.porcentajeDescuento}% OFF)`;
    }
    
    console.log(`📦 [Payment] Item final: ${p.nombre} - Precio: $${precioUnitario} (descuento: $${descuentoAplicado}, promo: ${promocionNombre || 'ninguna'})`);
    
    subtotal += precioUnitario * i.cantidad;
    return {
      productId: p.id,
      cantidad: i.cantidad,
      talle: i.talle,
      color: i.color ?? null,
      precioUnitario,
      precioOriginal: p.precio,
      descuentoMonto: descuentoAplicado > 0 ? descuentoAplicado : null,
      promocionId,
      promocionNombre,
      tienePromocionVigente: descuentoAplicado > 0, // Marcar si tiene promoción/liquidación
    };
  });
  
  // Aplicar cupón si existe (con descuento porcentual O bundle tipo NxM)
  // REGLA: El cupón SOLO aplica a productos SIN promoción vigente ni liquidación
  let descuentoCupon = 0;
  if (params.cuponAplicado && (params.cuponAplicado.descuento || params.cuponAplicado.tipoBundle)) {
    // Filtrar solo items SIN promoción/liquidación para el cupón
    const itemsElegibles = orderItems.filter(item => !item.tienePromocionVigente);
    
    if (itemsElegibles.length > 0) {
      // Calcular subtotal y cantidad SOLO de productos elegibles
      const subtotalElegible = itemsElegibles.reduce(
        (acc, item) => acc + (item.precioUnitario * item.cantidad), 
        0
      );
      const cantidadElegible = itemsElegibles.reduce(
        (acc, item) => acc + item.cantidad, 
        0
      );
      const precioPromedioElegible = cantidadElegible > 0 ? subtotalElegible / cantidadElegible : 0;
      
      const tieneDescuento = params.cuponAplicado.descuento !== null && params.cuponAplicado.descuento > 0;
      const tieneBundle = params.cuponAplicado.tipoBundle !== null && params.cuponAplicado.tipoBundle !== undefined;
      
      if (tieneDescuento && !tieneBundle) {
        // Solo porcentaje
        descuentoCupon = params.cuponAplicado.tipoDescuento === 'PORCENTAJE'
          ? Math.round((subtotalElegible * params.cuponAplicado.descuento!) / 100)
          : params.cuponAplicado.descuento!;
      } else if (tieneBundle && !tieneDescuento) {
        // Solo bundle - calcular descuento
        const configs: Record<string, { llevas: number; pagas: number }> = {
          'DOS_POR_UNO': { llevas: 2, pagas: 1 },
          'TRES_POR_DOS': { llevas: 3, pagas: 2 },
          'CUATRO_POR_TRES': { llevas: 4, pagas: 3 },
          'CINCO_POR_DOS': { llevas: 5, pagas: 2 },
          'CINCO_POR_TRES': { llevas: 5, pagas: 3 },
        };
        const config = configs[params.cuponAplicado.tipoBundle!];
        if (config) {
          const gruposCompletos = Math.floor(cantidadElegible / config.llevas);
          const productosRestantes = cantidadElegible % config.llevas;
          const montoPagadoGrupos = gruposCompletos * config.pagas * precioPromedioElegible;
          const montoPagadoRestantes = productosRestantes * precioPromedioElegible;
          const montoPagado = montoPagadoGrupos + montoPagadoRestantes;
          descuentoCupon = Math.round(subtotalElegible - montoPagado);
        }
      } else if (tieneBundle && tieneDescuento) {
        // Ambos: aplicar el mejor o combinar según configuración
        const descuentoPorcentaje = params.cuponAplicado.tipoDescuento === 'PORCENTAJE'
          ? Math.round((subtotalElegible * params.cuponAplicado.descuento!) / 100)
          : params.cuponAplicado.descuento!;
          
        const configs: Record<string, { llevas: number; pagas: number }> = {
          'DOS_POR_UNO': { llevas: 2, pagas: 1 },
          'TRES_POR_DOS': { llevas: 3, pagas: 2 },
          'CUATRO_POR_TRES': { llevas: 4, pagas: 3 },
          'CINCO_POR_DOS': { llevas: 5, pagas: 2 },
          'CINCO_POR_TRES': { llevas: 5, pagas: 3 },
        };
        const config = configs[params.cuponAplicado.tipoBundle!];
        let descuentoBundle = 0;
        if (config) {
          const gruposCompletos = Math.floor(cantidadElegible / config.llevas);
          const productosRestantes = cantidadElegible % config.llevas;
          const montoPagadoGrupos = gruposCompletos * config.pagas * precioPromedioElegible;
          const montoPagadoRestantes = productosRestantes * precioPromedioElegible;
          const montoPagado = montoPagadoGrupos + montoPagadoRestantes;
          descuentoBundle = Math.round(subtotalElegible - montoPagado);
        }
        
        if (params.cuponAplicado.combinable) {
          // Combinar: bundle + porcentaje
          const subtotalDespuesBundle = subtotalElegible - descuentoBundle;
          const descuentoPorcentajeSobreBundle = params.cuponAplicado.tipoDescuento === 'PORCENTAJE'
            ? Math.round((subtotalDespuesBundle * params.cuponAplicado.descuento!) / 100)
            : params.cuponAplicado.descuento!;
          descuentoCupon = descuentoBundle + descuentoPorcentajeSobreBundle;
        } else {
          // Aplicar el mejor
          descuentoCupon = Math.max(descuentoBundle, descuentoPorcentaje);
        }
      }
      
      console.log(`🎫 [Payment] Cupón aplicado: ${params.cuponAplicado.codigo} - Descuento: $${descuentoCupon} (sobre ${cantidadElegible} productos elegibles)`);
    } else {
      console.log(`🎫 [Payment] Cupón ${params.cuponAplicado.codigo} no aplicable: todos los productos tienen promoción/liquidación`);
    }
  }
  
  const total = Math.max(0, subtotal - descuentoCupon);

  // Create order number
  const numeroOrden = 'PAP-' + Date.now();
  
  console.log('📦 [Payment] Creando orden con los siguientes datos:');
  console.log('📦 [Payment] Número de orden:', numeroOrden);
  console.log('📦 [Payment] Subtotal:', subtotal);
  console.log('📦 [Payment] Descuento cupón:', descuentoCupon);
  console.log('📦 [Payment] Total:', total);
  console.log('📦 [Payment] Items con precios:');
  orderItems.forEach((item, idx) => {
    console.log(`   ${idx + 1}. Producto ${item.productId}: ${item.cantidad}x $${item.precioUnitario} = $${item.precioUnitario * item.cantidad}`);
  });

  // Preparar items para Prisma (excluir campo interno tienePromocionVigente)
  const itemsForPrisma = orderItems.map(({ tienePromocionVigente, ...item }) => item);

  console.log('💳 [Payment Service] Creando orden con installments:', params.installments || 1);

  const order = await prisma.order.create({
    data: {
      numeroOrden,
      usuarioId: params.usuarioId,
      subtotal,
      total,
      estado: 'EN_PROCESO',
      metodoPago: { provider: 'mercadopago' },
      direccionEnvio: params.direccionEnvio ?? null,
      fulfillmentType: params.fulfillmentType || 'shipping',
      pickupLocationId: params.pickupLocationId || null,
      paymentMethodDetail: params.paymentMethodDetail || 'mercadopago',
      installments: params.installments || 1,
      items: {
        create: itemsForPrisma,
      },
      payment: {
        create: { status: 'PENDING' },
      },
    },
    include: { 
      items: {
        include: {
          product: true,
        }
      }, 
      payment: true,
      usuario: {
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
        },
      },
    },
  });

  console.log('💳 [Payment Service] Orden creada:', {
    id: order.id,
    numeroOrden: order.numeroOrden,
    installments: order.installments,
    paymentMethodDetail: order.paymentMethodDetail,
  });

  // Crear notificación de nuevo pedido si está pendiente
  if (order.cmsStatus === 'PENDING') {
    try {
      await notificationService.createOrderNotification(order);
    } catch (error) {
      console.warn('Error creating order notification:', error);
    }
  }

  // Emitir evento WebSocket de nuevo pedido
  try {
    const wsService = getWebSocketService();
    wsService.emitOrderCreated(order);
  } catch (error) {
    console.warn('Error emitting order created event:', error);
  }

  // Create Mercado Pago preference
  const preference = await new Preference(mp).create({
    body: {
      items: orderItems.map((i) => {
      const p = byId.get(i.productId)!;
      return {
        id: p.id,
        title: p.nombre,
        quantity: i.cantidad,
        unit_price: i.precioUnitario / 100,
        currency_id: 'ARS',
      };
    }),
      back_urls: {
        success: `${env.API_URL}/api/payments/success?orderId=${order.id}`,
        failure: `${env.API_URL}/api/payments/failure?orderId=${order.id}`,
        pending: `${env.API_URL}/api/payments/pending?orderId=${order.id}`,
      },
      auto_return: 'approved' as const,
      notification_url: `${env.API_URL}/api/payments/webhook`,
      external_reference: order.id,
    },
  });

  await prisma.payment.update({ where: { orderId: order.id }, data: { preferenceId: preference.id } });

  return { order, init_point: preference.init_point, preferenceId: preference.id };
}

export async function handleWebhook(data: any) {
  // Mercado Pago can send multiple types; for simplicity, fetch payment by ID when type === payment
  if (data.type === 'payment' || data.action === 'payment.created' || data.action === 'payment.updated') {
    const paymentId = data.data?.id || data["data.id"];
    if (paymentId) {
      // Fetch payment info
      const payData = await new MPPayment(mp).get({ id: String(paymentId) });
      const status = (payData.status as string) || '';
      const externalRef = payData.external_reference as string | undefined;
      if (externalRef) {
        const orderId = externalRef;

        const mapStatus = (s: string): 'APPROVED' | 'REJECTED' | 'PENDING' =>
          s === 'approved' ? 'APPROVED' : s === 'rejected' ? 'REJECTED' : 'PENDING';

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const payment = await tx.payment.findUnique({ where: { orderId } });
          if (!payment) return;

          const newStatus = mapStatus(status);

          // Always sync latest payment data
          await tx.payment.update({
            where: { orderId },
            data: { paymentId: String(paymentId), status: newStatus, raw: payData as any },
          });

          // Idempotencia: solo procesar una vez cuando transiciona a APPROVED
          if (payment.status === 'APPROVED' || newStatus !== 'APPROVED') return;

          const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
          if (!order) return;

          // Descontar stock de variantes (color + talle) o del producto general
          for (const item of order.items as Array<{ productId: string; cantidad: number; color?: string; talle: number }>) {
            // Verificar si el producto tiene variantes
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              include: { variants: true },
            });

            if (!product) continue;

            // Si tiene variantes y el item tiene color y talle, descontar de la variante específica
            if (product.variants && product.variants.length > 0 && item.color && item.talle) {
              const variant = product.variants.find(
                v => v.colorCode === item.color && v.size === item.talle
              );

              if (variant) {
                // Descontar stock de la variante
                const currentStock = Number(variant.stock ?? 0);
                const nextStock = Math.max(0, currentStock - Number(item.cantidad));
                
                if (nextStock !== currentStock) {
                  await tx.productVariant.update({
                    where: { id: variant.id },
                    data: { stock: nextStock },
                  });
                }
              }

              // Recalcular stock total del producto desde todas las variantes
              const allVariants = await tx.productVariant.findMany({
                where: { productId: item.productId },
                select: { stock: true },
              });

              const stockTotal = allVariants.reduce((sum, v) => sum + v.stock, 0);

              await tx.product.update({
                where: { id: item.productId },
                data: { 
                  stock: stockTotal,
                  stockTotal: stockTotal,
                },
              });
            } else {
              // Si no tiene variantes, descontar del stock general (legacy)
              const currentStock = Number(product.stock ?? 0);
              const nextStock = Math.max(0, currentStock - Number(item.cantidad));
              
              if (nextStock !== currentStock) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: nextStock },
                });
              }
            }
          }
        });
      }
    }
  }
}
