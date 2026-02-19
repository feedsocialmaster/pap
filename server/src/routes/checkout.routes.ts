import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createCheckoutPayment, getPaymentStatus } from '../controllers/checkout-payment.controller.js';

const router = Router();

// Crear pago en checkout
router.post('/create-payment', requireAuth, createCheckoutPayment);

// Obtener estado de pago
router.get('/payment/:paymentId', requireAuth, getPaymentStatus);

export default router;
