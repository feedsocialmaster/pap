import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getMyOrder, listMyOrders } from '../controllers/orders.controller.js';
import { getBeneficiosExclusivos } from '../controllers/users.controller.js';
import {
  confirmarRecepcionHandler,
  obtenerTrackingHandler,
} from '../controllers/order-tracking.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/orders', listMyOrders);
router.get('/orders/:id', getMyOrder);
router.get('/orders/:id/tracking', obtenerTrackingHandler);
router.post('/orders/:id/confirmar-recepcion', confirmarRecepcionHandler);
router.get('/perfil/beneficios-exclusivos', getBeneficiosExclusivos);

export default router;
