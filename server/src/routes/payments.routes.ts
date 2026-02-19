import { Router } from 'express';
import * as ctrl from '../controllers/payments.controller.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createPreferenceSchema = z.object({
	usuarioId: z.string().min(1),
	fulfillmentType: z.enum(['shipping', 'pickup']).optional().default('shipping'),
	pickupLocationId: z.string().optional(),
	paymentMethodDetail: z.string().optional(),
	direccionEnvio: z.object({
		calle: z.string().min(3),
		ciudad: z.string().min(2),
		provincia: z.string().min(2),
		codigoPostal: z.string().min(3),
	}).nullish(),
	items: z
		.array(
			z.object({
				productId: z.string().min(1),
				cantidad: z.number().int().positive(),
				talle: z.number().int().positive(),
				color: z.string().optional(),
				precioConDescuento: z.number().int().positive().optional(),
			})
		)
		.min(1),
	puntosUsados: z.number().int().nonnegative().optional(),
	// Cuotas seleccionadas (1, 3, 6, 9, 12)
	installments: z.coerce.number().int().min(1).max(12).optional(),
	// Cupón aplicado
	cuponAplicado: z.object({
		codigo: z.string(),
		descuento: z.number().nullable(),
		tipoDescuento: z.enum(['PORCENTAJE', 'MONTO_FIJO']),
		tipoBundle: z.string().nullish(),
		combinable: z.boolean().optional(),
	}).nullish(),
});

router.post('/create-preference', requireAuth, validate({ body: createPreferenceSchema }), ctrl.createPreference);
// Raw body para webhooks se aplica a nivel app en /api/payments/webhook
router.post('/webhook', ctrl.webhook);
router.get('/success', ctrl.success);
router.get('/failure', ctrl.failure);
router.get('/pending', ctrl.pending);
// Endpoint para verificar estado del servicio de pagos (para diagnóstico)
router.get('/status', ctrl.checkStatus);

export default router;
