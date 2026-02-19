import { Router } from 'express';
import { getCupones, getCuponById, validarCupon, createCupon, updateCupon, deleteCupon, aplicarCupon, verificarDisponibilidadCodigos } from '../controllers/cupones.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';
const router = Router();
// Rutas para clientes (requieren autenticación de usuario)
router.get('/validar/:codigo', requireAuth, validarCupon);
router.post('/aplicar', requireAuth, aplicarCupon);
router.post('/verificar-disponibilidad', requireAuth, verificarDisponibilidadCodigos);
// Rutas protegidas para el CMS
const cmsAuth = [requireAuth, requireCMSAccess()];
router.get('/', cmsAuth, getCupones);
router.get('/:id', cmsAuth, getCuponById);
router.post('/', cmsAuth, createCupon);
router.put('/:id', cmsAuth, updateCupon);
router.delete('/:id', cmsAuth, deleteCupon);
export default router;
