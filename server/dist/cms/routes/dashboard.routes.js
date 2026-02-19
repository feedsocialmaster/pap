import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';
import { getDashboardStats, getServerTime } from '../controllers/dashboard.controller.js';
const router = Router();
// Todas las rutas del dashboard requieren autenticación y acceso al CMS
router.use(requireAuth);
router.use(requireCMSAccess());
// GET /api/cms/dashboard/stats - Obtener estadísticas del dashboard
router.get('/stats', getDashboardStats);
// GET /api/cms/dashboard/server-time - Obtener hora del servidor en GMT-3
router.get('/server-time', getServerTime);
export default router;
