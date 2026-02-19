import { Router } from 'express';
import dashboardRoutes from './dashboard.routes.js';
import cuponesRoutes from './cupones.routes.js';
import blogRoutes from './blog.routes.js';
import productosRoutes from './productos.routes.js';
import categoriasRoutes from './categorias.routes.js';
import promocionesRoutes from './promociones.routes.js';
import codigosPromocionalesRoutes from './codigos-promocionales.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import ordersRoutes from './orders.routes.js';
import siteContentRoutes from './site-content.routes.js';
const router = Router();
// Montar todas las rutas del CMS bajo /api/cms
// IMPORTANTE: Las rutas más específicas deben ir primero
router.use('/site-content', siteContentRoutes);
router.use('/promociones/codigos', codigosPromocionalesRoutes);
router.use('/promociones', promocionesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/cupones', cuponesRoutes);
router.use('/blog', blogRoutes);
router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/orders', ordersRoutes);
export default router;
