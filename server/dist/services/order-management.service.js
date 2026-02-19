import { prisma } from '../prisma.js';
import { getWebSocketService } from './websocket.service.js';
import { validateTransition, getRequiredFields, getAvailableTransitions, isFinalStatus, } from '../lib/order-state-machine.js';
import { TIMESTAMP_FIELDS_BY_STATUS, STATUS_TO_ESTADO_ENTREGA, } from '../types/order-status.js';
import { restoreStock, CONFIRMED_ORDER_STATUSES, REFUNDABLE_ORDER_STATUSES } from './inventory.service.js';
/**
 * Servicio para gestión de órdenes en tiempo real
 */
export class OrderManagementService {
    /**
     * Actualiza el estado de una orden con validaciones y auditoría
     */
    async updateOrderStatus(params) {
        const { orderId, newStatus, deliveryReason, cancellationReason, trackingNumber, courierName, changedBy, changedByEmail, notes, } = params;
        // Obtener orden actual con lock optimista
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        apellido: true,
                        telefono: true,
                    },
                },
                payment: true,
            },
        });
        if (!order) {
            throw new Error('Orden no encontrada');
        }
        const previousStatus = order.cmsStatus;
        // ——— Validar transición con la máquina de estados ———
        const transitionResult = validateTransition(previousStatus, newStatus, {
            id: order.id,
            cmsStatus: previousStatus,
            fulfillmentType: order.fulfillmentType || 'shipping',
            intentosEntrega: order.intentosEntrega || 0,
            version: order.version,
        });
        if (!transitionResult.isValid) {
            throw new Error(`Transición no permitida: ${transitionResult.error}`);
        }
        // ——— Validar campos requeridos por transición ———
        const requiredFields = getRequiredFields(previousStatus, newStatus);
        for (const field of requiredFields) {
            if (field === 'deliveryReason' && !deliveryReason) {
                throw new Error('El motivo de no entrega es obligatorio para esta transición');
            }
            if (field === 'cancellationReason' && !cancellationReason) {
                throw new Error('El motivo de cancelación es obligatorio para esta transición');
            }
        }
        const now = new Date();
        // ——— Construir campos de datos dinámicamente ———
        const dataToUpdate = {
            cmsStatus: newStatus,
            version: { increment: 1 },
        };
        // Asignar timestamp específico por estado
        const timestampField = TIMESTAMP_FIELDS_BY_STATUS[newStatus];
        if (timestampField) {
            dataToUpdate[timestampField] = now;
        }
        // Campos condicionales
        if (newStatus === 'NOT_DELIVERED') {
            dataToUpdate.deliveryReason = deliveryReason || null;
        }
        if (newStatus === 'CANCELLED') {
            dataToUpdate.cancellationReason = cancellationReason || null;
        }
        if (trackingNumber !== undefined) {
            dataToUpdate.trackingNumber = trackingNumber;
        }
        if (courierName !== undefined) {
            dataToUpdate.courierName = courierName;
        }
        // Guardar notas de envío cuando se despacha el pedido (IN_TRANSIT)
        if (newStatus === 'IN_TRANSIT' && notes !== undefined) {
            dataToUpdate.shippingNotes = notes || null;
        }
        // Sincronizar campo legacy estadoEntrega si existe mapeo
        const legacyEstado = STATUS_TO_ESTADO_ENTREGA[newStatus];
        if (legacyEstado) {
            dataToUpdate.estadoEntrega = legacyEstado;
        }
        // Incrementar intentosEntrega si se marca como NOT_DELIVERED
        if (newStatus === 'NOT_DELIVERED') {
            dataToUpdate.intentosEntrega = { increment: 1 };
        }
        try {
            // Transacción atómica
            const result = await prisma.$transaction(async (tx) => {
                // Actualizar orden con optimistic locking
                const updatedOrder = await tx.order.update({
                    where: {
                        id: orderId,
                        version: order.version, // Optimistic lock
                    },
                    data: dataToUpdate,
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                        usuario: {
                            select: {
                                id: true,
                                email: true,
                                nombre: true,
                                apellido: true,
                                telefono: true,
                            },
                        },
                    },
                });
                // ====== REPONER STOCK SI SE CANCELA UN PEDIDO CONFIRMADO ======
                // Si la orden tenía pago aprobado y ahora se cancela, restaurar el stock
                const wasConfirmed = CONFIRMED_ORDER_STATUSES.includes(previousStatus);
                const isCancelling = REFUNDABLE_ORDER_STATUSES.includes(newStatus);
                if (wasConfirmed && isCancelling) {
                    console.log(`📦 [OrderManagement] Restaurando stock para orden cancelada ${orderId}...`);
                    const orderItemsForStock = updatedOrder.items.map((item) => ({
                        productId: item.productId,
                        cantidad: item.cantidad,
                        talle: item.talle,
                        color: item.color,
                    }));
                    await restoreStock(orderItemsForStock, tx);
                    console.log(`✅ [OrderManagement] Stock restaurado exitosamente para orden ${orderId}`);
                }
                // Crear registro de auditoría
                await tx.orderAudit.create({
                    data: {
                        orderId,
                        changedBy,
                        changedByEmail,
                        action: `STATUS_CHANGE_${previousStatus}_TO_${newStatus}`,
                        previousStatus,
                        newStatus,
                        deliveryReason,
                        notes,
                        metadata: {
                            version: order.version,
                            timestamp: now.toISOString(),
                            cancellationReason: cancellationReason || undefined,
                            trackingNumber: trackingNumber || undefined,
                            courierName: courierName || undefined,
                            stockRestored: wasConfirmed && isCancelling,
                        },
                    },
                });
                return updatedOrder;
            });
            // ——— Emitir eventos WebSocket (fuera de la transacción) ———
            try {
                const wsService = getWebSocketService();
                // Evento de actualización de orden (CMS + usuario)
                wsService.emitOrderUpdated(result, {
                    previousStatus,
                    newStatus,
                    changedBy,
                    trackingNumber,
                    courierName,
                });
                // Evento de cambio de estado (CMS + usuario)
                wsService.emitOrderStatusChanged(orderId, previousStatus, newStatus, {
                    deliveryReason,
                    cancellationReason,
                    trackingNumber,
                    courierName,
                    deliveredAt: result.deliveredAt,
                    fulfillmentType: result.fulfillmentType,
                    usuarioId: result.usuarioId,
                });
                // Si se marcó como entregada, emitir evento de venta completada
                if (newStatus === 'DELIVERED') {
                    wsService.emitSaleCompleted(result);
                    // Emitir eventos de productos vendidos para actualizar ranking
                    result.items.forEach((item) => {
                        wsService.emitProductSold(item.productId, item.cantidad, item.precioUnitario * item.cantidad);
                    });
                }
                // DESACTIVADO: Las notificaciones de "Pedido Actualizado" fueron eliminadas.
                // Solo se mantienen las notificaciones de "Nuevo Pedido".
                // El evento WebSocket (emitOrderUpdated) sigue activo para actualizar la UI.
            }
            catch (wsError) {
                console.warn('Error emitiendo eventos WebSocket:', wsError);
                // No fallar la operación si el WS falla
            }
            return {
                success: true,
                order: result,
                previousStatus,
                newStatus,
            };
        }
        catch (error) {
            // Verificar si es error de concurrencia
            if (error.code === 'P2025') {
                throw new Error('Conflicto de concurrencia: la orden fue modificada por otro usuario');
            }
            throw error;
        }
    }
    /**
     * Rechaza un pedido pendiente (pago rechazado)
     */
    async rejectOrder(params) {
        const { orderId, reason, changedBy, changedByEmail, notes } = params;
        // Obtener orden actual
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        apellido: true,
                        telefono: true,
                    },
                },
            },
        });
        if (!order) {
            throw new Error('Orden no encontrada');
        }
        // Validar que esté en estado PENDING
        if (order.cmsStatus !== 'PENDING') {
            throw new Error(`No se puede rechazar una orden en estado ${order.cmsStatus}`);
        }
        const previousStatus = order.cmsStatus;
        const now = new Date();
        try {
            // Transacción atómica
            const result = await prisma.$transaction(async (tx) => {
                // Actualizar orden con estado de pago rechazado
                const updatedOrder = await tx.order.update({
                    where: {
                        id: orderId,
                        version: order.version,
                    },
                    data: {
                        cmsStatus: 'PAYMENT_REJECTED',
                        deliveryReason: reason,
                        version: { increment: 1 },
                    },
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                        usuario: {
                            select: {
                                id: true,
                                email: true,
                                nombre: true,
                                apellido: true,
                                telefono: true,
                            },
                        },
                    },
                });
                // Crear registro de auditoría
                await tx.orderAudit.create({
                    data: {
                        orderId,
                        changedBy,
                        changedByEmail,
                        action: 'PAYMENT_REJECTED',
                        previousStatus,
                        newStatus: 'PAYMENT_REJECTED',
                        deliveryReason: reason,
                        notes,
                        metadata: {
                            version: order.version,
                            timestamp: now.toISOString(),
                            reason,
                        },
                    },
                });
                return updatedOrder;
            });
            // Emitir eventos WebSocket
            try {
                const wsService = getWebSocketService();
                wsService.emitOrderUpdated(result, {
                    previousStatus,
                    newStatus: 'PAYMENT_REJECTED',
                    changedBy,
                    rejected: true,
                });
                wsService.emitOrderStatusChanged(orderId, previousStatus, 'PAYMENT_REJECTED', {
                    deliveryReason: reason,
                    rejected: true,
                    usuarioId: result.usuarioId,
                });
                // DESACTIVADO: Las notificaciones de "Pedido Actualizado" fueron eliminadas.
                // Solo se mantienen las notificaciones de "Nuevo Pedido".
            }
            catch (wsError) {
                console.warn('Error emitiendo eventos WebSocket:', wsError);
            }
            return {
                success: true,
                order: result,
            };
        }
        catch (error) {
            if (error.code === 'P2025') {
                throw new Error('Conflicto de concurrencia: la orden fue modificada por otro usuario');
            }
            throw error;
        }
    }
    /**
     * Obtiene ventas realizadas con filtros
     */
    async getSales(params) {
        const { from, to, status, limit = 50, offset = 0 } = params;
        const where = {};
        if (from || to) {
            where.fecha = {};
            if (from)
                where.fecha.gte = from;
            if (to)
                where.fecha.lte = to;
        }
        if (status && status.length > 0) {
            where.cmsStatus = { in: status };
        }
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        select: {
                            id: true,
                            productId: true,
                            cantidad: true,
                            talle: true,
                            color: true,
                            precioUnitario: true,
                            precioOriginal: true,
                            descuentoMonto: true,
                            promocionId: true,
                            promocionNombre: true,
                            product: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    precio: true,
                                },
                            },
                        },
                    },
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombre: true,
                            apellido: true,
                            telefono: true,
                        },
                    },
                    payment: true,
                    gatewayPayments: {
                        select: {
                            id: true,
                            amount: true,
                            currency: true,
                            status: true,
                            metadata: true,
                        },
                    },
                },
                orderBy: { fecha: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.order.count({ where }),
        ]);
        // LOG DEBUG: Verificar datos antes de enviar
        if (orders.length > 0) {
            console.log('📦 [OrderManagement.getSales] Datos de primera orden:');
            console.log('   id:', orders[0].id);
            console.log('   numeroOrden:', orders[0].numeroOrden);
            console.log('   fecha:', orders[0].fecha);
            console.log('   fecha tipo:', typeof orders[0].fecha);
            console.log('   total:', orders[0].total);
            console.log('   installments:', orders[0].installments);
            console.log('   paymentMethodDetail:', orders[0].paymentMethodDetail);
        }
        return {
            orders,
            total,
            limit,
            offset,
        };
    }
    // DEBUG: Log temporal para verificar datos
    logOrdersForDebug(orders) {
        if (orders.length > 0) {
            console.log('📦 [OrderManagement] Primera orden enviada:', {
                id: orders[0].id,
                fecha: orders[0].fecha,
                fechaTipo: typeof orders[0].fecha,
                total: orders[0].total
            });
        }
    }
    /**
     * Obtiene estadísticas del dashboard
     */
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [salesToday, ordersToday, pendingOrders] = await Promise.all([
            // Ventas de hoy
            prisma.order.aggregate({
                where: {
                    fecha: { gte: today, lt: tomorrow },
                    cmsStatus: { in: ['DELIVERED', 'PAYMENT_APPROVED', 'PREPARING', 'READY_FOR_SHIPPING', 'READY_FOR_PICKUP', 'IN_TRANSIT'] },
                },
                _sum: { total: true },
                _count: true,
            }),
            // Órdenes de hoy
            prisma.order.count({
                where: {
                    fecha: { gte: today, lt: tomorrow },
                },
            }),
            // Órdenes pendientes
            prisma.order.count({
                where: {
                    cmsStatus: { in: ['PENDING', 'PAYMENT_APPROVED', 'PREPARING', 'READY_FOR_SHIPPING', 'READY_FOR_PICKUP', 'IN_TRANSIT'] },
                },
            }),
        ]);
        return {
            salesToday: salesToday._count || 0,
            revenueToday: salesToday._sum.total || 0,
            ordersToday,
            pendingOrders,
        };
    }
    /**
     * Obtiene historial de auditoría de una orden
     */
    async getOrderAudit(orderId) {
        return await prisma.orderAudit.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Obtiene las transiciones disponibles para una orden específica
     */
    async getAvailableTransitionsForOrder(orderId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                cmsStatus: true,
                fulfillmentType: true,
                intentosEntrega: true,
                version: true,
            },
        });
        if (!order) {
            throw new Error('Orden no encontrada');
        }
        const transitions = getAvailableTransitions({
            id: order.id,
            cmsStatus: order.cmsStatus,
            fulfillmentType: order.fulfillmentType,
            intentosEntrega: order.intentosEntrega,
            version: order.version,
        });
        return {
            currentStatus: order.cmsStatus,
            availableTransitions: transitions,
            isFinal: isFinalStatus(order.cmsStatus),
        };
    }
    /**
     * Obtiene una orden por ID con toda la info extendida
     */
    async getOrderById(orderId) {
        return await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                nombre: true,
                                precio: true,
                                imagenes: {
                                    take: 1,
                                    orderBy: { orden: 'asc' },
                                },
                            },
                        },
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        apellido: true,
                        telefono: true,
                    },
                },
                payment: true,
                gatewayPayments: {
                    select: {
                        id: true,
                        amount: true,
                        currency: true,
                        status: true,
                        metadata: true,
                    },
                },
            },
        });
    }
}
export const orderManagementService = new OrderManagementService();
