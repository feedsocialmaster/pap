import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';
import { actualizarEstadoEntregaHandler } from '../../controllers/order-tracking.controller.js';
const router = Router();
const cmsAuth = [requireAuth, requireCMSAccess()];
const vendedorAuth = [requireAuth, requireCMSAccess(['VENDEDOR', 'ADMIN_CMS', 'SUPER_SU'])];
// Actualizar estado de entrega de una orden
router.put('/:id/estado-entrega', vendedorAuth, actualizarEstadoEntregaHandler);
export default router;
