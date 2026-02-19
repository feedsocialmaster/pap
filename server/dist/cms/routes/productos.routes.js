import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireCMSAccess, requireRole } from '../middleware/cms-auth.js';
import { getProductos, getProductoPorId, crearProducto, actualizarProducto, eliminarProducto, forceDeleteProducto, getEstadisticas, validarSlug, generarSlug, getProductosConEstadisticas, } from '../controllers/productos.controller.js';
import variantsRouter from './variants.routes.js';
const router = Router();
// Todas las rutas requieren autenticación CMS
router.use(requireAuth, requireCMSAccess());
// Rutas de productos
router.get('/', getProductos);
router.get('/estadisticas', getEstadisticas);
router.get('/con-estadisticas', getProductosConEstadisticas);
router.post('/generar-slug', generarSlug);
router.get('/validar-slug/:slug', validarSlug);
router.get('/:id', getProductoPorId);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.delete('/:id', eliminarProducto);
// Borrado forzoso - solo SUPER_SU y DESARROLLADOR
router.post('/:id/force-delete', requireRole(['SUPER_SU', 'DESARROLLADOR']), forceDeleteProducto);
// Sub-rutas: variantes de producto
router.use('/:productId/variants', variantsRouter);
export default router;
