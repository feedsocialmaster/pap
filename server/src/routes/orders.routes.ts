import { Router } from 'express';
import { listOrders, getOrder } from '../controllers/orders.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN_CMS', 'SUPER_SU'));

router.get('/', listOrders);
router.get('/:id', getOrder);

export default router;
