import { PaymentGatewayFactory } from '../services/payment-gateway/index.js';
import { paymentGatewayService } from '../services/payment-gateway.service.js';
import { prisma } from '../prisma.js';
import { getWebSocketService } from '../services/websocket.service.js';
/**
 * Webhook genérico para recibir notificaciones de MercadoPago
 */
export async function mercadopagoWebhook(req, res, next) {
    try {
        // MercadoPago envía notificaciones en query params y body
        const { type, id } = req.query;
        const body = req.body;
        console.log('MercadoPago webhook received:', { type, id, body });
        // Responder inmediatamente a MercadoPago
        res.status(200).send('OK');
        // Procesar webhook de forma asíncrona
        if (type === 'payment' && id) {
            await processPaymentNotification(String(id));
        }
    }
    catch (error) {
        console.error('Error processing MercadoPago webhook:', error);
        // Aún así responder OK para evitar reintentos
        res.status(200).send('OK');
    }
}
/**
 * Procesa una notificación de pago
 */
async function processPaymentNotification(externalId) {
    try {
        // Buscar el pago en la base de datos
        const payment = await prisma.gatewayPayment.findFirst({
            where: { externalId },
            include: {
                gateway: true,
                order: {
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                        usuario: true,
                    },
                },
            },
        });
        if (!payment) {
            console.log('Payment not found for externalId:', externalId);
            return;
        }
        // Obtener adaptador y consultar estado
        const gateway = await paymentGatewayService.getGatewayById(payment.gatewayId, true);
        const adapter = PaymentGatewayFactory.getAdapter(gateway.provider);
        const result = await adapter.queryPayment(gateway.config, externalId);
        if (result.success) {
            // Mapear estado
            const statusMap = {
                PENDING: 'PENDING',
                PROCESSING: 'PROCESSING',
                SUCCESS: 'SUCCESS',
                FAILED: 'FAILED',
                CANCELLED: 'CANCELLED',
                REFUNDED: 'REFUNDED',
            };
            const newStatus = statusMap[result.status] || 'PENDING';
            // Actualizar pago
            await paymentGatewayService.updatePaymentStatus(payment.id, newStatus, {
                lastWebhookAt: new Date().toISOString(),
                externalMetadata: result.metadata,
            });
            // Si el pago fue aprobado, actualizar orden y emitir eventos
            if (newStatus === 'SUCCESS') {
                const updatedOrder = await prisma.order.update({
                    where: { id: payment.orderId },
                    data: {
                        estado: 'EN_PROCESO',
                        cmsStatus: 'PAYMENT_APPROVED',
                        paymentApprovedAt: new Date(),
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
                            },
                        },
                    },
                });
                // Emitir eventos WebSocket
                try {
                    const wsService = getWebSocketService();
                    // Evento de orden creada/actualizada
                    wsService.emitOrderCreated(updatedOrder);
                    // Evento de pago recibido
                    wsService.emitPaymentReceived(payment);
                    // Eventos de productos vendidos
                    updatedOrder.items.forEach((item) => {
                        wsService.emitProductSold(item.productId, item.cantidad, item.precioUnitario * item.cantidad);
                    });
                }
                catch (wsError) {
                    console.warn('Error emitting WebSocket events:', wsError);
                }
            }
            console.log('Payment updated:', {
                paymentId: payment.id,
                externalId,
                newStatus,
            });
        }
    }
    catch (error) {
        console.error('Error processing payment notification:', error);
    }
}
/**
 * Webhook genérico para otros procesadores
 */
export async function genericWebhook(req, res, next) {
    try {
        const { provider } = req.params;
        const payload = req.body;
        console.log(`Webhook received for provider: ${provider}`, payload);
        // Responder OK
        res.status(200).send('OK');
        // Aquí se puede procesar según el proveedor
        // TODO: Implementar procesamiento específico por proveedor
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(200).send('OK');
    }
}
