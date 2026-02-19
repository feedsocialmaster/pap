import { Request, Response, NextFunction } from 'express';
import { notificationService, GetNotificationsParams } from '../services/notifications.service.js';
import { NotificationStatus } from '@prisma/client';
import { z } from 'zod';

/**
 * Schema de validación para obtener notificaciones
 */
const getNotificationsSchema = z.object({
  status: z.enum(['UNREAD', 'READ', 'all']).optional().default('all'),
  limit: z.string().optional().default('20'),
  offset: z.string().optional().default('0'),
});

/**
 * Schema de validación para marcar múltiples como leídas
 */
const markMultipleSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
});

/**
 * Obtener notificaciones
 * GET /api/cms/notifications
 */
export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = getNotificationsSchema.safeParse(req.query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros inválidos',
        details: validation.error.errors,
      });
    }

    const { status, limit, offset } = validation.data;

    const params: GetNotificationsParams = {
      status: status === 'all' ? 'all' : (status as NotificationStatus),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      recipientRole: 'cms_admin',
    };

    const result = await notificationService.getNotifications(params);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener contador de notificaciones no leídas
 * GET /api/cms/notifications/unread-count
 */
export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount('cms_admin');

    res.json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Marcar notificación como leída
 * POST /api/cms/notifications/:id/mark-read
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID de notificación requerido',
      });
    }

    const notification = await notificationService.markAsRead(id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Marcar múltiples notificaciones como leídas
 * POST /api/cms/notifications/mark-read-multiple
 */
export async function markMultipleAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const validation = markMultipleSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros inválidos',
        details: validation.error.errors,
      });
    }

    const { notificationIds } = validation.data;

    const count = await notificationService.markMultipleAsRead(notificationIds);

    res.json({
      success: true,
      data: {
        updatedCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Limpiar notificaciones antiguas
 * DELETE /api/cms/notifications/clean-old
 */
export async function cleanOldNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const { days } = req.query;
    const daysToKeep = days ? parseInt(days as string, 10) : 90;

    const deletedCount = await notificationService.cleanOldNotifications(daysToKeep);

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Se eliminaron ${deletedCount} notificaciones antiguas`,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Limpiar todas las notificaciones leídas
 * DELETE /api/cms/notifications/clear-read
 */
export async function clearReadNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const deletedCount = await notificationService.clearReadNotifications('cms_admin');

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Se eliminaron ${deletedCount} notificaciones leídas`,
      },
    });
  } catch (error) {
    next(error);
  }
}
