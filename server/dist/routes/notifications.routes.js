import { Router } from 'express';
import { getNotifications, getUnreadCount, markAsRead, markMultipleAsRead, cleanOldNotifications, clearReadNotifications, } from '../controllers/notifications.controller.js';
const router = Router();
/**
 * @route GET /api/cms/notifications
 * @desc Obtener notificaciones con filtros
 * @query status - UNREAD | READ | all
 * @query limit - Número de notificaciones a retornar
 * @query offset - Offset para paginación
 */
router.get('/', getNotifications);
/**
 * @route GET /api/cms/notifications/unread-count
 * @desc Obtener contador de notificaciones no leídas
 */
router.get('/unread-count', getUnreadCount);
/**
 * @route POST /api/cms/notifications/:id/mark-read
 * @desc Marcar notificación como leída
 */
router.post('/:id/mark-read', markAsRead);
/**
 * @route POST /api/cms/notifications/mark-read-multiple
 * @desc Marcar múltiples notificaciones como leídas
 * @body notificationIds - Array de IDs de notificaciones
 */
router.post('/mark-read-multiple', markMultipleAsRead);
/**
 * @route DELETE /api/cms/notifications/clean-old
 * @desc Limpiar notificaciones antiguas (más de X días)
 * @query days - Número de días a mantener (default: 90)
 */
router.delete('/clean-old', cleanOldNotifications);
/**
 * @route DELETE /api/cms/notifications/clear-read
 * @desc Limpiar todas las notificaciones leídas
 */
router.delete('/clear-read', clearReadNotifications);
export default router;
