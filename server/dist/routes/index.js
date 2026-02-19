import { Router } from 'express';
import auth from './auth.routes.js';
import products from './products.routes.js';
import uploads from './uploads.routes.js';
import payments from './payments.routes.js';
import promotions from './promotions.routes.js';
import orders from './orders.routes.js';
import my from './my.routes.js';
import status from './status.routes.js';
import codigos from './codigos.routes.js';
import checkout from './checkout.routes.js';
import webhooks from './webhooks.routes.js';
import notifications from './notifications.routes.js';
import users from './users.routes.js';
import contact from './contact.routes.js';
import publicRoutes from './public.routes.js';
import cmsRoutes from '../cms/routes/index.js';
import cmsOrdersRoutes from './cms-orders.routes.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
const router = Router();
router.get('/', (_req, res) => {
    res.json({ ok: true, version: 'v1' });
});
router.use('/auth', auth);
router.use('/products', products);
router.use('/uploads', uploads);
router.use('/payments', payments);
router.use('/promotions', promotions);
router.use('/codigos', codigos);
router.use('/orders', orders);
router.use('/my', my);
router.use('/status', status);
router.use('/checkout', checkout);
router.use('/webhooks', webhooks);
router.use('/users', users);
router.use('/contact', contact);
router.use('/public', publicRoutes);
// Ruta pública para obtener promoción destacada
router.get('/promociones/destacada', async (_req, res) => {
    try {
        const ahora = new Date();
        // Normalizar a inicio y fin del día para comparación correcta
        const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
        const finDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
        const promocion = await prisma.cMSPromocion.findFirst({
            where: {
                activo: true,
                destacado: true,
                fechaInicio: { lte: finDia }, // La promoción debe haber iniciado antes del fin del día actual
                fechaFin: { gte: inicioDia }, // La promoción debe terminar después del inicio del día actual
            },
            orderBy: [
                { orden: 'asc' },
                { fechaInicio: 'desc' }
            ],
        });
        res.json({ success: true, promocion });
    }
    catch (error) {
        console.error('Error al obtener promoción destacada:', error);
        res.status(500).json({ success: false, error: 'Error al obtener promoción' });
    }
});
// Ruta pública para obtener todas las promociones vigentes
router.get('/promociones/vigentes', async (_req, res) => {
    try {
        const ahora = new Date();
        // Normalizar a inicio y fin del día para comparación correcta
        const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
        const finDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
        console.log('🔍 [Promociones] Consultando promociones vigentes');
        console.log('🔍 [Promociones] Fecha actual:', ahora.toISOString());
        console.log('🔍 [Promociones] Rango de búsqueda:', inicioDia.toISOString(), 'a', finDia.toISOString());
        const promociones = await prisma.cMSPromocion.findMany({
            where: {
                activo: true,
                fechaInicio: { lte: finDia }, // La promoción debe haber iniciado antes del fin del día actual
                fechaFin: { gte: inicioDia }, // La promoción debe terminar después del inicio del día actual
            },
            orderBy: [
                { destacado: 'desc' },
                { orden: 'asc' },
                { fechaInicio: 'desc' }
            ],
            select: {
                id: true,
                titulo: true,
                descripcion: true,
                fechaInicio: true,
                fechaFin: true,
                activo: true,
                destacado: true,
            }
        });
        console.log(`✅ [Promociones] Se encontraron ${promociones.length} promociones vigentes`);
        res.json({ success: true, promociones });
    }
    catch (error) {
        console.error('Error al obtener promociones vigentes:', error);
        res.status(500).json({ success: false, error: 'Error al obtener promociones' });
    }
});
// Ruta pública para obtener códigos promocionales activos
router.get('/codigos-promocionales/activos', async (_req, res) => {
    try {
        const codigos = await prisma.cMSCodigoPromocional.findMany({
            where: {
                activo: true,
            },
            orderBy: [
                { createdAt: 'desc' }
            ],
            select: {
                id: true,
                codigo: true,
                descuento: true,
                tipoDescuento: true,
                tipoBundle: true,
                activo: true,
            }
        });
        res.json({ success: true, codigos });
    }
    catch (error) {
        console.error('Error al obtener códigos promocionales:', error);
        res.status(500).json({ success: false, error: 'Error al obtener códigos' });
    }
});
// Nota: No aplicar requireAuth global aquí porque cada ruta del CMS
// ya tiene su propia protección (requireAuth + requireCMSAccess)
// y algunas rutas como /blog/publicados deben ser públicas
router.use('/cms', cmsRoutes);
router.use('/cms', cmsOrdersRoutes);
router.use('/cms/notifications', requireAuth, notifications);
export default router;
