/**
 * Public API Routes
 * Endpoints públicos para el frontend (sin autenticación)
 */
import { Router } from 'express';
import { prisma } from '../prisma.js';
const router = Router();
// Keys válidos para contenido del sitio
const VALID_CONTENT_KEYS = [
    'home_body',
    'home_payment_promotions',
    'privacy_policy',
];
/**
 * GET /api/public/site-content/:key
 * Endpoint público para obtener contenido renderizado
 */
router.get('/site-content/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const locale = req.query.locale || 'es-AR';
        if (!VALID_CONTENT_KEYS.includes(key)) {
            return res.status(404).json({ success: false, error: 'Contenido no encontrado' });
        }
        const content = await prisma.siteContent.findUnique({
            where: {
                key_locale: { key, locale },
            },
            select: {
                key: true,
                title: true,
                content: true,
                version: true,
                updatedAt: true,
                published: true,
            },
        });
        // Solo devolver contenido publicado
        if (!content || !content.content || !content.published) {
            return res.status(404).json({ success: false, error: 'Contenido no disponible' });
        }
        // Cache headers for public content
        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        res.json({
            success: true,
            content,
        });
    }
    catch (error) {
        console.error('Error al obtener contenido público:', error);
        res.status(500).json({ success: false, error: 'Error al obtener contenido' });
    }
});
export default router;
