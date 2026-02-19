import { prisma } from '../prisma.js';
import { NotificationType, NotificationStatus, CMSNotification } from '@prisma/client';
import { getWebSocketService } from './websocket.service.js';

export interface CreateNotificationParams {
  type: NotificationType;
  payload: {
    orderId: string;
    numeroOrden?: string;
    customerName?: string;
    customerEmail?: string;
    total?: number;
    shortText?: string;
    [key: string]: any;
  };
  recipientRole?: string;
  relatedOrderId?: string;
}

export interface GetNotificationsParams {
  status?: NotificationStatus | 'all';
  limit?: number;
  offset?: number;
  recipientRole?: string;
}

class NotificationService {
  /**
   * Crear nueva notificación
   */
  async createNotification(params: CreateNotificationParams): Promise<CMSNotification> {
    const notification = await prisma.cMSNotification.create({
      data: {
        type: params.type,
        payload: params.payload,
        recipientRole: params.recipientRole || 'cms_admin',
        relatedOrderId: params.relatedOrderId || params.payload.orderId,
      },
    });

    // Emitir evento WebSocket en tiempo real
    this.emitNotificationEvent(notification);

    return notification;
  }

  /**
   * Obtener notificaciones con filtros
   */
  async getNotifications(params: GetNotificationsParams): Promise<{
    notifications: CMSNotification[];
    total: number;
    unreadCount: number;
  }> {
    const {
      status = 'all',
      limit = 20,
      offset = 0,
      recipientRole = 'cms_admin',
    } = params;

    const where: any = {
      recipientRole,
    };

    if (status !== 'all') {
      where.status = status;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.cMSNotification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.cMSNotification.count({ where }),
      prisma.cMSNotification.count({
        where: {
          recipientRole,
          status: NotificationStatus.UNREAD,
        },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<CMSNotification> {
    const notification = await prisma.cMSNotification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    // Emitir evento de actualización de contador
    this.emitCountUpdate();

    return notification;
  }

  /**
   * Marcar múltiples notificaciones como leídas
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<number> {
    const result = await prisma.cMSNotification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    this.emitCountUpdate();

    return result.count;
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getUnreadCount(recipientRole: string = 'cms_admin'): Promise<number> {
    return prisma.cMSNotification.count({
      where: {
        recipientRole,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  /**
   * Crear notificación de nuevo pedido
   */
  async createOrderNotification(order: any): Promise<CMSNotification> {
    const payload = {
      orderId: order.id,
      numeroOrden: order.numeroOrden,
      customerName: `${order.usuario.nombre} ${order.usuario.apellido}`,
      customerEmail: order.usuario.email,
      total: order.total,
      shortText: `Nuevo pedido #${order.numeroOrden} por $${order.total}`,
      cmsStatus: order.cmsStatus,
    };

    return this.createNotification({
      type: NotificationType.ORDER_CREATED,
      payload,
      relatedOrderId: order.id,
    });
  }

  /**
   * Crear notificación de actualización de pedido
   */
  async createOrderUpdateNotification(order: any, changes: any): Promise<CMSNotification> {
    const payload = {
      orderId: order.id,
      numeroOrden: order.numeroOrden,
      customerName: `${order.usuario.nombre} ${order.usuario.apellido}`,
      total: order.total,
      shortText: `Pedido #${order.numeroOrden} actualizado`,
      changes,
      cmsStatus: order.cmsStatus,
    };

    return this.createNotification({
      type: NotificationType.ORDER_UPDATED,
      payload,
      relatedOrderId: order.id,
    });
  }

  /**
   * Emitir evento WebSocket de nueva notificación
   */
  private emitNotificationEvent(notification: CMSNotification) {
    try {
      const wsService = getWebSocketService();
      wsService.emitNotification(notification);
    } catch (error) {
      console.warn('Error emitting notification WebSocket event:', error);
    }
  }

  /**
   * Emitir actualización de contador de notificaciones
   */
  private async emitCountUpdate() {
    try {
      const wsService = getWebSocketService();
      const count = await this.getUnreadCount();
      wsService.emitNotificationCount(count);
    } catch (error) {
      console.warn('Error emitting notification count update:', error);
    }
  }

  /**
   * Limpiar notificaciones antiguas (más de 90 días)
   */
  async cleanOldNotifications(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.cMSNotification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: NotificationStatus.READ,
      },
    });

    return result.count;
  }

  /**
   * Limpiar todas las notificaciones leídas
   */
  async clearReadNotifications(recipientRole: string = 'cms_admin'): Promise<number> {
    const result = await prisma.cMSNotification.deleteMany({
      where: {
        recipientRole,
        status: NotificationStatus.READ,
      },
    });

    return result.count;
  }
}

export const notificationService = new NotificationService();
