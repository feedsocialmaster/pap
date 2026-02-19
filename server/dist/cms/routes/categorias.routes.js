import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess } from '../middleware/cms-auth.js';
import { getCategorias, getCategoriaPorId, crearCategoria, actualizarCategoria, eliminarCategoria, getEstadisticas, asignarProductos, } from '../controllers/categorias.controller.js';
const router = Router();
// Todas las rutas requieren autenticación CMS
router.use(requireAuth, requireCMSAccess());
// Rutas de categorías
router.get('/', getCategorias);
router.get('/estadisticas', getEstadisticas);
router.get('/:id', getCategoriaPorId);
router.post('/', crearCategoria);
router.put('/:id', actualizarCategoria);
router.delete('/:id', eliminarCategoria);
router.post('/:id/asignar-productos', asignarProductos);
export default router;
