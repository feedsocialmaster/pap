import { Router } from 'express';
import { mercadopagoWebhook, genericWebhook } from '../controllers/webhook.controller.js';

const router = Router();

// Webhook de MercadoPago (público)
router.post('/mercadopago', mercadopagoWebhook);

// Webhook genérico para otros proveedores
router.post('/:provider', genericWebhook);

export default router;
