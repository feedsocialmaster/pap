import { Request, Response } from 'express';
import { z } from 'zod';
import { createOrderAndPreference, handleWebhook, isPaymentServiceConfigured } from '../services/payment.service.js';
import { AuthedRequest } from '../middleware/auth.js';

const orderSchema = z.object({
  usuarioId: z.string().min(1),
  direccionEnvio: z.object({
    calle: z.string().min(3),
    ciudad: z.string().min(2),
    provincia: z.string().min(2),
    codigoPostal: z.string().min(3),
  }).nullish(),
  items: z.array(z.object({
    productId: z.string().min(1),
    cantidad: z.number().int().positive(),
    talle: z.number().int().positive(),
    color: z.string().optional(),
    precioConDescuento: z.number().int().positive().optional(), // Precio con promociones aplicadas desde el frontend
  })).min(1),
  puntosUsados: z.number().int().nonnegative().optional(),
  fulfillmentType: z.enum(['shipping', 'pickup']).optional(),
  pickupLocationId: z.string().optional(),
  paymentMethodDetail: z.string().optional(),
  // Usar coerce para aceptar strings y convertirlos a número automáticamente
  installments: z.coerce.number().int().min(1).max(12).optional(), // Cuotas seleccionadas (1, 3, 6, 9, 12)
  cuponAplicado: z.object({
    codigo: z.string(),
    descuento: z.number().nullable(),
    tipoDescuento: z.enum(['PORCENTAJE', 'MONTO_FIJO']),
    tipoBundle: z.string().nullish(),
    combinable: z.boolean().optional(),
  }).nullish(),
});

export async function createPreference(req: Request, res: Response) {
  try {
    console.log('=== createPreference INICIO ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
    // DEBUG: Ver valor crudo de installments ANTES del parse
    console.log('🔍 [createPreference] installments CRUDO:', {
      valor: req.body?.installments,
      tipo: typeof req.body?.installments,
      paymentMethodDetail: req.body?.paymentMethodDetail,
    });
    
    console.log('📦 Items recibidos:');
    if (req.body?.items) {
      req.body.items.forEach((item: any, idx: number) => {
        console.log(`  Item ${idx + 1}: productId=${item.productId}, precioConDescuento=${item.precioConDescuento}`);
      });
    }
    console.log('User en request (JWT):', (req as AuthedRequest).user);
    console.log('Authorization header:', req.headers.authorization?.substring(0, 20) + '...');
    
    const data = orderSchema.parse(req.body);
    console.log('✅ Datos validados correctamente');
    console.log('💳 Datos de pago recibidos:', {
      paymentMethodDetail: data.paymentMethodDetail,
      installments: data.installments,
    });
    console.log('🎫 Datos de cupón recibidos:', {
      cuponAplicado: data.cuponAplicado,
      codigo: data.cuponAplicado?.codigo,
      descuento: data.cuponAplicado?.descuento,
      tipoDescuento: data.cuponAplicado?.tipoDescuento,
    });
    
    const userIdFromAuth = (req as AuthedRequest).user?.id;
    const userEmailFromAuth = (req as AuthedRequest).user?.email;
    console.log('👤 User ID from JWT token:', userIdFromAuth);
    console.log('👤 User email from JWT token:', userEmailFromAuth);
    console.log('👤 User ID from body:', data.usuarioId);
    console.log('👤 Tipo de User ID (JWT):', typeof userIdFromAuth);
    console.log('👤 Longitud de User ID (JWT):', userIdFromAuth?.length);
    
    if (!userIdFromAuth) {
      console.error('❌ No se encontró usuario autenticado en JWT');
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }
    
    // IMPORTANTE: Siempre usar el ID del token JWT (más seguro)
    const finalUserId = userIdFromAuth;
    console.log('👤 Usuario final para crear orden:', finalUserId);
    
    const pref = await createOrderAndPreference({
      ...data,
      usuarioId: finalUserId,
    });
    
    console.log('✅ Preferencia creada exitosamente:', pref.preferenceId);
    res.status(201).json({ success: true, data: pref });
  } catch (e: any) {
    console.error('=== createPreference ERROR ===');
    console.error('Tipo de error:', e?.constructor?.name);
    console.error('Mensaje:', e?.message);
    console.error('Stack:', e?.stack);
    
    // Detectar errores específicos de Mercado Pago
    const errorMessage = e?.message || 'Error al procesar el pago';
    const isMPAuthError = errorMessage.includes('policy') && errorMessage.includes('UNAUTHORIZED') ||
                          errorMessage.includes('invalid_token') ||
                          errorMessage.includes('unauthorized') ||
                          e?.cause?.message?.includes('UNAUTHORIZED');
    
    const isMPConfigError = isMPAuthError || 
                            errorMessage.includes('accessToken') ||
                            errorMessage.includes('access_token');
    
    const isUserNotFoundError = errorMessage.includes('Usuario no encontrado');
    
    let userFriendlyMessage: string;
    let errorDetails: string | undefined;
    let statusCode = 400;
    
    if (isMPConfigError) {
      console.error('❌ Error de configuración de Mercado Pago - Token inválido o no configurado');
      userFriendlyMessage = 'Error de configuración del sistema de pagos';
      errorDetails = 'La pasarela de pago no está configurada correctamente. Por favor contacte al administrador del sitio.';
      statusCode = 503; // Service Unavailable
    } else if (isUserNotFoundError) {
      userFriendlyMessage = 'Usuario no encontrado';
      errorDetails = 'El usuario en tu sesión no existe en la base de datos. Por favor, cierra sesión y vuelve a iniciar sesión.';
      statusCode = 401;
    } else {
      userFriendlyMessage = errorMessage;
      errorDetails = undefined;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: userFriendlyMessage,
      details: errorDetails,
      errorType: isMPConfigError ? 'payment_config' : isUserNotFoundError ? 'auth' : 'general'
    });
  }
}

export async function webhook(req: Request, res: Response) {
  try {
    // if body is a buffer (raw), try to verify signature using MP_WEBHOOK_SECRET
    const rawBody = (req as any).body;
    let parsed: any = rawBody;
    if (Buffer.isBuffer(rawBody)) {
      const rawString = rawBody.toString('utf-8');
      // optional verification
      // check several header names that providers may use
      const sig = req.headers['x-hub-signature'] || req.headers['x-hub-signature-256'] || req.headers['x-mp-signature'] || req.headers['x-hook-signature'];
      if (process.env.MP_WEBHOOK_SECRET && sig) {
        try {
          const crypto = await import('crypto');
          const h = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET || '');
          h.update(rawString);
          const digest = `sha256=${h.digest('hex')}`;
          if (String(sig) !== digest) {
            // signature mismatch
            console.warn('Webhook signature mismatch');
            return res.status(400).json({ error: 'Invalid signature' });
          }
        } catch (err) {
          // ignore verification errors
          console.warn('Webhook signature verification error', err);
        }
      }
      try {
        parsed = JSON.parse(rawString);
      } catch (err) {
        parsed = rawString;
      }
    }

    await handleWebhook(parsed);
    res.status(200).json({});
  } catch (e: any) {
    res.status(200).json({});
  }
}

export async function success(req: Request, res: Response) {
  const orderId = req.query.orderId as string;
  // redirect to frontend confirmation page
  res.redirect(302, `/checkout/confirmacion?status=approved&orderId=${orderId}`);
}

export async function failure(req: Request, res: Response) {
  const orderId = req.query.orderId as string;
  res.redirect(302, `/checkout/confirmacion?status=failure&orderId=${orderId}`);
}

export async function pending(req: Request, res: Response) {
  const orderId = req.query.orderId as string;
  res.redirect(302, `/checkout/confirmacion?status=pending&orderId=${orderId}`);
}

/**
 * Endpoint para verificar si el servicio de pagos está configurado
 * Útil para diagnóstico y para el frontend antes de permitir pagos
 */
export async function checkStatus(req: Request, res: Response) {
  const configured = isPaymentServiceConfigured();
  res.json({
    success: true,
    data: {
      configured,
      message: configured 
        ? 'Servicio de pagos configurado correctamente'
        : 'El token de Mercado Pago no está configurado o es inválido'
    }
  });
}
