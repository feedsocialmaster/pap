import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env.js';
/**
 * Eventos de WebSocket para sincronización en tiempo real
 */
export var GatewayEvent;
(function (GatewayEvent) {
    GatewayEvent["GATEWAY_UPDATED"] = "gateway.updated";
    GatewayEvent["GATEWAY_DELETED"] = "gateway.deleted";
    GatewayEvent["GATEWAY_CREATED"] = "gateway.created";
    GatewayEvent["RULE_UPDATED"] = "rule.updated";
    GatewayEvent["RULE_DELETED"] = "rule.deleted";
    GatewayEvent["RULE_CREATED"] = "rule.created";
    GatewayEvent["PRODUCT_PRICE_OVERRIDE"] = "product.price.override";
    GatewayEvent["CART_RECALCULATE"] = "cart.recalculate";
    GatewayEvent["PAYMENT_STATUS_UPDATED"] = "payment.status.updated";
    // Nuevos eventos para órdenes y ventas
    GatewayEvent["ORDER_CREATED"] = "order.created";
    GatewayEvent["ORDER_UPDATED"] = "order.updated";
    GatewayEvent["ORDER_STATUS_CHANGED"] = "order.status.changed";
    GatewayEvent["PAYMENT_RECEIVED"] = "payment.received";
    GatewayEvent["PRODUCT_SOLD"] = "product.sold";
    GatewayEvent["SALE_COMPLETED"] = "sale.completed";
    // Eventos de notificaciones
    GatewayEvent["NOTIFICATION_NEW"] = "notification.new";
    GatewayEvent["NOTIFICATION_COUNT"] = "notification.count";
    // Evento de seguimiento de pedido (para el usuario)
    GatewayEvent["ORDER_TRACKING_UPDATE"] = "order.tracking.update";
    // Eventos de promociones y códigos
    GatewayEvent["PROMOCION_CREATED"] = "promocion.created";
    GatewayEvent["PROMOCION_UPDATED"] = "promocion.updated";
    GatewayEvent["PROMOCION_DELETED"] = "promocion.deleted";
    GatewayEvent["CODIGO_PROMOCIONAL_CREATED"] = "codigo.created";
    GatewayEvent["CODIGO_PROMOCIONAL_UPDATED"] = "codigo.updated";
    GatewayEvent["CODIGO_PROMOCIONAL_DELETED"] = "codigo.deleted";
    GatewayEvent["PROMOCIONES_REFRESH"] = "promociones.refresh";
    // Eventos de contenido del sitio (edición en tiempo real)
    GatewayEvent["SITE_CONTENT_UPDATED"] = "site-content.updated";
    GatewayEvent["SITE_CONTENT_EDITING_START"] = "site-content.editing.start";
    GatewayEvent["SITE_CONTENT_EDITING_STOP"] = "site-content.editing.stop";
    GatewayEvent["SITE_CONTENT_SYNC"] = "site-content.sync";
    GatewayEvent["SITE_CONTENT_CONFLICT"] = "site-content.conflict";
})(GatewayEvent || (GatewayEvent = {}));
/**
 * Servicio de WebSocket para comunicación en tiempo real
 */
export class WebSocketService {
    constructor(server) {
        this.connectedClients = new Map();
        const allowedOrigins = env.APP_URL.split(',').map(url => url.trim());
        this.io = new SocketIOServer(server, {
            cors: {
                origin: allowedOrigins,
                credentials: true,
            },
            path: '/ws',
            pingTimeout: 60000,
            pingInterval: 25000,
            connectTimeout: 45000,
            transports: ['websocket', 'polling'],
        });
        this.initialize();
    }
    initialize() {
        this.io.on('connection', (socket) => {
            console.log(`WebSocket client connected: ${socket.id}`);
            // Autenticación (opcional, puede verificar token aquí)
            const userId = socket.handshake.auth.userId;
            const userName = socket.handshake.auth.userName;
            if (userId) {
                this.connectedClients.set(userId, socket);
                socket.join(`user:${userId}`);
            }
            // Join a canal CMS si es usuario CMS
            socket.on('join:cms', () => {
                socket.join('cms');
                console.log(`Client ${socket.id} joined CMS channel`);
            });
            // Join a canal de carrito
            socket.on('join:cart', (cartId) => {
                socket.join(`cart:${cartId}`);
                console.log(`Client ${socket.id} joined cart ${cartId}`);
            });
            // =====================
            // Site Content Editing Events
            // =====================
            // Unirse a un canal de edición de contenido
            socket.on('site-content:join', (data) => {
                const { key, locale } = data;
                const channel = `site-content:${key}:${locale}`;
                socket.join(channel);
                console.log(`📝 [WebSocket] ${socket.id} joined site-content channel: ${channel}`);
                // Notificar a otros editores que alguien se unió
                if (userId) {
                    socket.to(channel).emit(GatewayEvent.SITE_CONTENT_EDITING_START, {
                        key,
                        locale,
                        userId,
                        userName: userName || 'Usuario',
                        timestamp: new Date().toISOString(),
                    });
                }
            });
            // Abandonar un canal de edición de contenido
            socket.on('site-content:leave', (data) => {
                const { key, locale } = data;
                const channel = `site-content:${key}:${locale}`;
                socket.leave(channel);
                console.log(`📝 [WebSocket] ${socket.id} left site-content channel: ${channel}`);
                // Notificar a otros editores que alguien se fue
                if (userId) {
                    socket.to(channel).emit(GatewayEvent.SITE_CONTENT_EDITING_STOP, {
                        key,
                        locale,
                        userId,
                        timestamp: new Date().toISOString(),
                    });
                }
            });
            // Evento de sincronización de contenido (para colaboración en tiempo real)
            socket.on('site-content:sync', (data) => {
                const { key, locale, content, version } = data;
                const channel = `site-content:${key}:${locale}`;
                // Broadcast a todos excepto al emisor
                socket.to(channel).emit(GatewayEvent.SITE_CONTENT_SYNC, {
                    key,
                    locale,
                    content,
                    version,
                    userId,
                    userName: userName || 'Usuario',
                    timestamp: new Date().toISOString(),
                });
            });
            socket.on('disconnect', () => {
                console.log(`WebSocket client disconnected: ${socket.id}`);
                if (userId) {
                    this.connectedClients.delete(userId);
                }
            });
        });
    }
    /**
     * Emite evento de actualización de pasarela
     */
    emitGatewayUpdated(gatewayId, changes) {
        this.io.to('cms').emit(GatewayEvent.GATEWAY_UPDATED, {
            gatewayId,
            changes,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de refresh de promociones (público para el ticker)
     */
    emitPromocionesRefresh() {
        this.io.emit(GatewayEvent.PROMOCIONES_REFRESH, {
            timestamp: new Date().toISOString(),
        });
        console.log('🎯 [WebSocket] Promociones refresh emitido');
    }
    /**
     * Emite evento de eliminación de pasarela
     */
    emitGatewayDeleted(gatewayId) {
        this.io.to('cms').emit(GatewayEvent.GATEWAY_DELETED, {
            gatewayId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de creación de pasarela
     */
    emitGatewayCreated(gateway) {
        this.io.to('cms').emit(GatewayEvent.GATEWAY_CREATED, {
            gateway,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de actualización de regla
     */
    emitRuleUpdated(ruleId, gatewayId, changes) {
        this.io.to('cms').emit(GatewayEvent.RULE_UPDATED, {
            ruleId,
            gatewayId,
            changes,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de eliminación de regla
     */
    emitRuleDeleted(ruleId, gatewayId) {
        this.io.to('cms').emit(GatewayEvent.RULE_DELETED, {
            ruleId,
            gatewayId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de creación de regla
     */
    emitRuleCreated(rule) {
        this.io.to('cms').emit(GatewayEvent.RULE_CREATED, {
            rule,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de override de precio de producto
     */
    emitProductPriceOverride(productId, newPrice, gatewayId) {
        this.io.emit(GatewayEvent.PRODUCT_PRICE_OVERRIDE, {
            productId,
            newPrice,
            gatewayId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento para recalcular carrito
     */
    emitCartRecalculate(cartId, trigger) {
        this.io.to(`cart:${cartId}`).emit(GatewayEvent.CART_RECALCULATE, {
            cartId,
            trigger,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de actualización de estado de pago
     */
    emitPaymentStatusUpdated(paymentId, status, orderId) {
        this.io.to('cms').emit(GatewayEvent.PAYMENT_STATUS_UPDATED, {
            paymentId,
            status,
            orderId,
            timestamp: new Date().toISOString(),
        });
        // También notificar al usuario específico si está conectado
        this.io.to(`order:${orderId}`).emit(GatewayEvent.PAYMENT_STATUS_UPDATED, {
            paymentId,
            status,
            orderId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Obtiene la instancia de Socket.IO
     */
    getIO() {
        return this.io;
    }
    /**
     * Emite evento de creación de orden
     */
    emitOrderCreated(order) {
        this.io.to('cms').emit(GatewayEvent.ORDER_CREATED, {
            order: {
                id: order.id,
                numeroOrden: order.numeroOrden,
                fecha: order.fecha, // Campo correcto para el frontend
                total: order.total,
                cmsStatus: order.cmsStatus,
                fulfillmentType: order.fulfillmentType,
                paymentMethodDetail: order.paymentMethodDetail,
                installments: order.installments || 1, // Cuotas de pago
                direccionEnvio: order.direccionEnvio,
                items: order.items,
                usuario: order.usuario,
                payment: order.payment,
                gatewayPayments: order.gatewayPayments,
                version: order.version || 1,
            },
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de actualización de orden (CMS + usuario)
     */
    emitOrderUpdated(order, changes) {
        this.io.to('cms').emit(GatewayEvent.ORDER_UPDATED, {
            order: {
                id: order.id,
                numeroOrden: order.numeroOrden,
                fecha: order.fecha,
                cmsStatus: order.cmsStatus,
                deliveryReason: order.deliveryReason,
                deliveredAt: order.deliveredAt,
                fulfillmentType: order.fulfillmentType,
                trackingNumber: order.trackingNumber,
                courierName: order.courierName,
                paymentApprovedAt: order.paymentApprovedAt,
                preparingStartedAt: order.preparingStartedAt,
                readyForShippingAt: order.readyForShippingAt,
                readyForPickupAt: order.readyForPickupAt,
                shippedAt: order.shippedAt,
                cancellationReason: order.cancellationReason,
                updatedAt: new Date().toISOString(),
            },
            changes,
            timestamp: new Date().toISOString(),
        });
        // Notificar también al usuario específico
        if (order.usuarioId) {
            this.io.to(`user:${order.usuarioId}`).emit(GatewayEvent.ORDER_UPDATED, {
                orderId: order.id,
                status: order.cmsStatus,
                trackingNumber: order.trackingNumber,
                courierName: order.courierName,
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Emite evento de cambio de estado de orden (CMS + usuario)
     */
    emitOrderStatusChanged(orderId, previousStatus, newStatus, metadata) {
        // Notificar al CMS
        this.io.to('cms').emit(GatewayEvent.ORDER_STATUS_CHANGED, {
            orderId,
            previousStatus,
            newStatus,
            metadata,
            timestamp: new Date().toISOString(),
        });
        // Notificar al usuario para seguimiento en tiempo real
        if (metadata?.usuarioId) {
            this.io.to(`user:${metadata.usuarioId}`).emit(GatewayEvent.ORDER_TRACKING_UPDATE, {
                orderId,
                previousStatus,
                newStatus,
                trackingNumber: metadata?.trackingNumber,
                courierName: metadata?.courierName,
                fulfillmentType: metadata?.fulfillmentType,
                timestamp: new Date().toISOString(),
            });
        }
    }
    /**
     * Emite evento de pago recibido
     */
    emitPaymentReceived(payment) {
        this.io.to('cms').emit(GatewayEvent.PAYMENT_RECEIVED, {
            orderId: payment.orderId,
            amount: payment.amount,
            paymentType: payment.currency || 'ARS',
            installments: payment.metadata?.installments || false,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de producto vendido (para ranking)
     */
    emitProductSold(productId, quantity, totalAmount) {
        this.io.to('cms').emit(GatewayEvent.PRODUCT_SOLD, {
            productId,
            quantity,
            totalAmount,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de venta completada
     */
    emitSaleCompleted(sale) {
        this.io.to('cms').emit(GatewayEvent.SALE_COMPLETED, {
            orderId: sale.id,
            total: sale.total,
            items: sale.items,
            completedAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de nueva notificación
     */
    emitNotification(notification) {
        this.io.to('cms').emit(GatewayEvent.NOTIFICATION_NEW, {
            id: notification.id,
            type: notification.type,
            payload: notification.payload,
            status: notification.status,
            createdAt: notification.createdAt,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite evento de actualización de contador de notificaciones
     */
    emitNotificationCount(count) {
        this.io.to('cms').emit(GatewayEvent.NOTIFICATION_COUNT, {
            unreadCount: count,
            timestamp: new Date().toISOString(),
        });
    }
    // ====================
    // Site Content Realtime Methods
    // ====================
    /**
     * Emite evento de actualización de contenido del sitio
     * Se envía a todos los clientes editando el mismo contenido
     */
    emitSiteContentUpdated(key, locale, data) {
        const channel = `site-content:${key}:${locale}`;
        // Emitir a todos los que están editando este contenido
        this.io.to(channel).emit(GatewayEvent.SITE_CONTENT_UPDATED, {
            key,
            locale,
            ...data,
            timestamp: new Date().toISOString(),
        });
        // También emitir al canal CMS general para actualizar listas
        this.io.to('cms').emit(GatewayEvent.SITE_CONTENT_SYNC, {
            key,
            locale,
            version: data.version,
            timestamp: new Date().toISOString(),
        });
        console.log(`📤 [WebSocket] Site content updated: ${key} v${data.version}`);
    }
    /**
     * Emite evento de conflicto de versión
     */
    emitSiteContentConflict(socketId, data) {
        this.io.to(socketId).emit(GatewayEvent.SITE_CONTENT_CONFLICT, {
            ...data,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Emite un evento a todos los sockets en una sala/room específica
     */
    emitToRoom(room, event, data) {
        const roomSockets = this.io.sockets.adapter.rooms.get(room);
        const clientCount = roomSockets ? roomSockets.size : 0;
        console.log(`📡 [WebSocket] Emitiendo evento '${event}' a room '${room}' (${clientCount} clientes conectados)`);
        if (clientCount === 0) {
            console.warn(`⚠️  [WebSocket] No hay clientes en el room '${room}'. El evento no llegará a nadie.`);
        }
        this.io.to(room).emit(event, {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
        });
        console.log(`✅ [WebSocket] Evento '${event}' emitido exitosamente`);
    }
    /**
     * Broadcast que un usuario empezó a editar
     */
    emitEditingStart(key, locale, userId, userName) {
        const channel = `site-content:${key}:${locale}`;
        this.io.to(channel).emit(GatewayEvent.SITE_CONTENT_EDITING_START, {
            key,
            locale,
            userId,
            userName,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Broadcast que un usuario dejó de editar
     */
    emitEditingStop(key, locale, userId) {
        const channel = `site-content:${key}:${locale}`;
        this.io.to(channel).emit(GatewayEvent.SITE_CONTENT_EDITING_STOP, {
            key,
            locale,
            userId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Permite que un cliente se una a un canal de edición de contenido
     */
    joinSiteContentChannel(socketId, key, locale) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            const channel = `site-content:${key}:${locale}`;
            socket.join(channel);
            console.log(`👤 [WebSocket] Socket ${socketId} joined ${channel}`);
        }
    }
    /**
     * Permite que un cliente abandone un canal de edición de contenido
     */
    leaveSiteContentChannel(socketId, key, locale) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            const channel = `site-content:${key}:${locale}`;
            socket.leave(channel);
            console.log(`👤 [WebSocket] Socket ${socketId} left ${channel}`);
        }
    }
}
// Singleton instance
let wsService = null;
export function initializeWebSocket(server) {
    if (!wsService) {
        wsService = new WebSocketService(server);
        console.log('✅ WebSocket service initialized');
    }
    return wsService;
}
export function getWebSocketService() {
    if (!wsService) {
        throw new Error('WebSocket service not initialized. Call initializeWebSocket first.');
    }
    return wsService;
}
