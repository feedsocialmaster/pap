import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';
import { getPromociones, getPromocionPorId, crearPromocion, actualizarPromocion, eliminarPromocion, toggleActivo, getEstadisticas, } from '../controllers/promociones.controller.js';
const router = Router();
// Todas las rutas requieren autenticación CMS
router.use(requireAuth, requireCMSAccess());
// Rutas de promociones
router.get('/estadisticas', getEstadisticas);
router.get('/:id', getPromocionPorId);
router.get('/', getPromociones);
router.post('/', crearPromocion);
router.put('/:id', actualizarPromocion);
router.put('/:id/toggle', toggleActivo);
router.delete('/:id', eliminarPromocion);
export default router;
