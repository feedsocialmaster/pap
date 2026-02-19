import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';
import { getCodigosPromocionales, crearCodigoPromocional, eliminarCodigoPromocional, toggleActivo, validarCodigo, } from '../controllers/codigos-promocionales.controller.js';
const router = Router();
// Ruta pública para validar códigos en el carrito
router.post('/validar', validarCodigo);
// Rutas protegidas CMS
router.use(requireAuth, requireCMSAccess());
router.get('/', getCodigosPromocionales);
router.post('/', crearCodigoPromocional);
router.put('/:id/toggle', toggleActivo);
router.delete('/:id', eliminarCodigoPromocional);
export default router;
