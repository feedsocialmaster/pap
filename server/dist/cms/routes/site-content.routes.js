/**
 * Site Content Management API Routes
 *
 * Endpoints for managing editable site content (Home, Privacy Policy)
 *
 * API Contract:
 * - GET    /api/cms/site-content/:key          - Get content by key
 * - POST   /api/cms/site-content/:key          - Create/update content
 * - GET    /api/cms/site-content/:key/versions - Get version history
 * - POST   /api/cms/site-content/:key/rollback - Rollback to previous version
 * - GET    /api/cms/site-content               - List all content keys
 */
import { Router } from 'express';
import { prisma } from '../../prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { sanitizeHTML, validateContent, generateContentDiff } from '../../utils/html-sanitizer.js';
import { getWebSocketService } from '../../services/websocket.service.js';
const router = Router();
// Roles permitidos para gestionar contenido del sitio
const SITE_CONTENT_ROLES = ['DUENA', 'DESARROLLADOR', 'ADMIN_CMS', 'GERENTE_COMERCIAL', 'SUPER_SU'];
// Keys válidos para contenido del sitio
const VALID_CONTENT_KEYS = [
    'home_body', // Página Principal
    'home_payment_promotions', // Medios de Pago y Promociones
    'privacy_policy', // Política de Privacidad
];
// Mapeo de keys a URLs públicas
const KEY_TO_URL = {
    'home_body': '/',
    'home_payment_promotions': '/',
    'privacy_policy': '/privacidad',
};
// Mapeo de keys a títulos para display
const KEY_TO_TITLE = {
    'home_body': 'Página Principal',
    'home_payment_promotions': 'Medios de Pago y Promociones',
    'privacy_policy': 'Política de Privacidad',
};
/**
 * Middleware para validar key de contenido
 */
function validateContentKey(req, res, next) {
    const { key } = req.params;
    if (!key) {
        return res.status(400).json({ success: false, error: 'Se requiere especificar la clave del contenido' });
    }
    if (!VALID_CONTENT_KEYS.includes(key)) {
        return res.status(400).json({
            success: false,
            error: 'Clave de contenido inválida',
            validKeys: VALID_CONTENT_KEYS,
        });
    }
    return next();
}
/**
 * GET /api/cms/site-content
 * Lista todos los contenidos editables con sus metadatos
 */
router.get('/', requireAuth, requireRole(...SITE_CONTENT_ROLES), async (req, res) => {
    try {
        const locale = req.query.locale || 'es-AR';
        // Obtener todos los contenidos existentes
        const contents = await prisma.siteContent.findMany({
            where: { locale },
            select: {
                id: true,
                key: true,
                title: true,
                version: true,
                published: true,
                updatedAt: true,
                updatedBy: true,
            },
            orderBy: { key: 'asc' },
        });
        // Crear lista completa con keys faltantes
        const contentMap = new Map(contents.map(c => [c.key, c]));
        const fullList = VALID_CONTENT_KEYS.map(key => {
            const existing = contentMap.get(key);
            return {
                key,
                title: KEY_TO_TITLE[key],
                url: KEY_TO_URL[key],
                ...(existing ? {
                    id: existing.id,
                    version: existing.version,
                    published: existing.published,
                    updatedAt: existing.updatedAt,
                    hasContent: true,
                } : {
                    version: 0,
                    published: false,
                    hasContent: false,
                }),
            };
        });
        res.json({ success: true, contents: fullList, locale });
    }
    catch (error) {
        console.error('Error al listar contenidos del sitio:', error);
        res.status(500).json({ success: false, error: 'Error al obtener lista de contenidos' });
    }
});
/**
 * GET /api/cms/site-content/:key
 * Obtiene el contenido de una página específica
 */
router.get('/:key', requireAuth, requireRole(...SITE_CONTENT_ROLES), validateContentKey, async (req, res) => {
    try {
        const { key } = req.params;
        const locale = req.query.locale || 'es-AR';
        const content = await prisma.siteContent.findUnique({
            where: {
                key_locale: { key, locale },
            },
        });
        if (!content) {
            // Devolver estructura vacía para contenido no inicializado
            return res.json({
                success: true,
                content: {
                    key,
                    locale,
                    title: KEY_TO_TITLE[key],
                    content: '',
                    version: 0,
                    published: false,
                    url: KEY_TO_URL[key],
                },
            });
        }
        res.json({
            success: true,
            content: {
                ...content,
                url: KEY_TO_URL[key],
                displayTitle: KEY_TO_TITLE[key],
            },
        });
    }
    catch (error) {
        console.error('Error al obtener contenido del sitio:', error);
        res.status(500).json({ success: false, error: 'Error al obtener contenido' });
    }
});
/**
 * POST /api/cms/site-content/:key
 * Crea o actualiza el contenido de una página
 * Implementa optimistic concurrency con versiones
 */
router.post('/:key', requireAuth, requireRole(...SITE_CONTENT_ROLES), validateContentKey, async (req, res) => {
    try {
        const { key } = req.params;
        const { content, version, locale = 'es-AR', title, published = true, changeReason } = req.body;
        const userId = req.user?.id;
        const userName = `${req.user?.nombre || ''} ${req.user?.apellido || ''}`.trim() || req.user?.email;
        // Validar contenido
        const validation = validateContent(content);
        if (!validation.valid) {
            return res.status(400).json({ success: false, error: validation.error });
        }
        // Sanitizar HTML
        const sanitizedContent = sanitizeHTML(content || '');
        // Verificar contenido existente
        const existing = await prisma.siteContent.findUnique({
            where: {
                key_locale: { key, locale },
            },
        });
        // Verificar conflicto de versiones (optimistic concurrency)
        if (existing && version !== undefined && version !== existing.version) {
            return res.status(409).json({
                success: false,
                error: 'version_conflict',
                message: 'El contenido fue modificado por otro usuario. Recarga la página para ver los cambios.',
                serverVersion: existing.version,
                serverContent: existing.content,
                serverUpdatedAt: existing.updatedAt,
            });
        }
        const newVersion = (existing?.version || 0) + 1;
        // Generar diff para auditoría
        const diff = existing ? generateContentDiff(existing.content, sanitizedContent) : '[Contenido inicial]';
        // Usar transacción para garantizar consistencia
        const result = await prisma.$transaction(async (tx) => {
            // Crear o actualizar contenido principal
            const updated = await tx.siteContent.upsert({
                where: {
                    key_locale: { key, locale },
                },
                create: {
                    key,
                    locale,
                    title: title || KEY_TO_TITLE[key],
                    content: sanitizedContent,
                    version: 1,
                    published,
                    updatedBy: userId,
                    metadata: {
                        createdBy: userId,
                        createdByName: userName,
                    },
                },
                update: {
                    title: title || undefined,
                    content: sanitizedContent,
                    version: newVersion,
                    published,
                    updatedBy: userId,
                    metadata: {
                        lastEditBy: userId,
                        lastEditByName: userName,
                        previousVersion: existing?.version,
                    },
                },
            });
            // Guardar versión histórica
            await tx.siteContentVersion.create({
                data: {
                    siteContentId: updated.id,
                    version: newVersion,
                    content: sanitizedContent,
                    title: title || KEY_TO_TITLE[key],
                    diff,
                    createdBy: userId,
                    createdByName: userName,
                    changeReason: changeReason || undefined,
                },
            });
            return updated;
        });
        // Emitir evento WebSocket para sincronización en tiempo real
        try {
            const wsService = getWebSocketService();
            if (wsService) {
                wsService.emitSiteContentUpdated(key, locale, {
                    version: result.version,
                    content: result.content,
                    updatedBy: userId,
                    updatedByName: userName,
                    updatedAt: result.updatedAt.toISOString(),
                });
            }
        }
        catch (wsError) {
            console.warn('WebSocket emit failed (non-critical):', wsError);
        }
        // Log de auditoría
        console.log(`📝 [Site Content] ${key} actualizado a v${result.version} por ${userName} (${userId})`);
        res.json({
            success: true,
            content: result,
            newVersion: result.version,
        });
    }
    catch (error) {
        console.error('Error al guardar contenido del sitio:', error);
        res.status(500).json({ success: false, error: 'Error al guardar contenido' });
    }
});
/**
 * GET /api/cms/site-content/:key/versions
 * Obtiene el historial de versiones de un contenido
 */
router.get('/:key/versions', requireAuth, requireRole(...SITE_CONTENT_ROLES), validateContentKey, async (req, res) => {
    try {
        const { key } = req.params;
        const locale = req.query.locale || 'es-AR';
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const content = await prisma.siteContent.findUnique({
            where: {
                key_locale: { key, locale },
            },
        });
        if (!content) {
            return res.json({ success: true, versions: [], currentVersion: 0 });
        }
        const versions = await prisma.siteContentVersion.findMany({
            where: { siteContentId: content.id },
            orderBy: { version: 'desc' },
            take: limit,
            select: {
                id: true,
                version: true,
                title: true,
                diff: true,
                createdBy: true,
                createdByName: true,
                createdAt: true,
                changeReason: true,
            },
        });
        res.json({
            success: true,
            versions,
            currentVersion: content.version,
            totalVersions: versions.length,
        });
    }
    catch (error) {
        console.error('Error al obtener versiones:', error);
        res.status(500).json({ success: false, error: 'Error al obtener historial de versiones' });
    }
});
/**
 * GET /api/cms/site-content/:key/versions/:versionNum
 * Obtiene una versión específica para preview
 */
router.get('/:key/versions/:versionNum', requireAuth, requireRole(...SITE_CONTENT_ROLES), validateContentKey, async (req, res) => {
    try {
        const { key, versionNum } = req.params;
        const locale = req.query.locale || 'es-AR';
        const versionNumber = parseInt(versionNum);
        if (isNaN(versionNumber) || versionNumber < 1) {
            return res.status(400).json({ success: false, error: 'Número de versión inválido' });
        }
        const content = await prisma.siteContent.findUnique({
            where: {
                key_locale: { key, locale },
            },
        });
        if (!content) {
            return res.status(404).json({ success: false, error: 'Contenido no encontrado' });
        }
        const version = await prisma.siteContentVersion.findUnique({
            where: {
                siteContentId_version: {
                    siteContentId: content.id,
                    version: versionNumber,
                },
            },
        });
        if (!version) {
            return res.status(404).json({ success: false, error: 'Versión no encontrada' });
        }
        res.json({
            success: true,
            version,
            currentVersion: content.version,
        });
    }
    catch (error) {
        console.error('Error al obtener versión específica:', error);
        res.status(500).json({ success: false, error: 'Error al obtener versión' });
    }
});
/**
 * POST /api/cms/site-content/:key/rollback
 * Revierte el contenido a una versión anterior
 */
router.post('/:key/rollback', requireAuth, requireRole(...SITE_CONTENT_ROLES), validateContentKey, async (req, res) => {
    try {
        const { key } = req.params;
        const { version: targetVersion, locale = 'es-AR' } = req.body;
        const userId = req.user?.id;
        const userName = `${req.user?.nombre || ''} ${req.user?.apellido || ''}`.trim() || req.user?.email;
        if (!targetVersion || isNaN(parseInt(targetVersion))) {
            return res.status(400).json({ success: false, error: 'Se requiere especificar la versión a restaurar' });
        }
        const versionNumber = parseInt(targetVersion);
        const content = await prisma.siteContent.findUnique({
            where: {
                key_locale: { key, locale },
            },
        });
        if (!content) {
            return res.status(404).json({ success: false, error: 'Contenido no encontrado' });
        }
        // Obtener la versión a restaurar
        const targetVersionData = await prisma.siteContentVersion.findUnique({
            where: {
                siteContentId_version: {
                    siteContentId: content.id,
                    version: versionNumber,
                },
            },
        });
        if (!targetVersionData) {
            return res.status(404).json({ success: false, error: 'Versión no encontrada' });
        }
        const newVersion = content.version + 1;
        // Restaurar usando transacción
        const result = await prisma.$transaction(async (tx) => {
            // Actualizar contenido principal
            const updated = await tx.siteContent.update({
                where: { id: content.id },
                data: {
                    content: targetVersionData.content,
                    title: targetVersionData.title,
                    version: newVersion,
                    updatedBy: userId,
                    metadata: {
                        restoredFrom: versionNumber,
                        restoredBy: userId,
                        restoredByName: userName,
                    },
                },
            });
            // Crear nueva versión con el contenido restaurado
            await tx.siteContentVersion.create({
                data: {
                    siteContentId: content.id,
                    version: newVersion,
                    content: targetVersionData.content,
                    title: targetVersionData.title,
                    diff: `[Restaurado desde versión ${versionNumber}]`,
                    createdBy: userId,
                    createdByName: userName,
                    changeReason: `Rollback a versión ${versionNumber}`,
                },
            });
            return updated;
        });
        // Emitir evento WebSocket
        try {
            const wsService = getWebSocketService();
            if (wsService) {
                wsService.emitSiteContentUpdated(key, locale, {
                    version: result.version,
                    content: result.content,
                    updatedBy: userId,
                    updatedByName: userName,
                    updatedAt: result.updatedAt.toISOString(),
                    isRollback: true,
                    restoredFromVersion: versionNumber,
                });
            }
        }
        catch (wsError) {
            console.warn('WebSocket emit failed (non-critical):', wsError);
        }
        console.log(`🔄 [Site Content] ${key} restaurado a v${versionNumber} (ahora v${result.version}) por ${userName}`);
        res.json({
            success: true,
            content: result,
            newVersion: result.version,
            restoredFromVersion: versionNumber,
        });
    }
    catch (error) {
        console.error('Error al hacer rollback:', error);
        res.status(500).json({ success: false, error: 'Error al restaurar versión' });
    }
});
export default router;
