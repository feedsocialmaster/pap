import { paymentGatewayService } from '../services/payment-gateway.service.js';
import { prisma } from '../prisma.js';
/**
 * Crea un pago en checkout usando la pasarela seleccionada
 */
export async function createCheckoutPayment(req, res, next) {
    try {
        const { gatewayId, orderId, items, customerEmail, customerName } = req.body;
        if (!gatewayId || !orderId || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                error: 'gatewayId, orderId e items son obligatorios',
            });
        }
        // Obtener la orden
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
                        email: true,
                        nombre: true,
                        apellido: true,
                    },
                },
            },
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Orden no encontrada',
            });
        }
        // Calcular precio final con reglas de pasarela
        let totalAmount = 0;
        const processedItems = [];
        for (const item of order.items) {
            const priceCalc = await paymentGatewayService.calculateFinalPrice({
                basePrice: item.precioUnitario,
                productId: item.productId,
                gatewayId,
            });
            const itemTotal = priceCalc.finalPrice * item.cantidad;
            totalAmount += itemTotal;
            processedItems.push({
                id: item.productId,
                title: item.product.nombre,
                quantity: item.cantidad,
                unitPrice: priceCalc.finalPrice,
            });
        }
        // Crear pago
        const payment = await paymentGatewayService.createPayment({
            gatewayId,
            orderId,
            orderNumber: order.numeroOrden,
            amount: totalAmount,
            currency: 'ARS',
            description: `Orden #${order.numeroOrden}`,
            customerEmail: customerEmail || order.usuario?.email,
            customerName: customerName || `${order.usuario?.nombre} ${order.usuario?.apellido}`,
            items: processedItems,
            metadata: {
                orderNumber: order.numeroOrden,
                itemsCount: order.items.length,
            },
        });
        res.json({
            success: payment.success,
            data: {
                paymentId: payment.id,
                checkoutUrl: payment.checkoutUrl,
                externalId: payment.externalId,
                externalReference: payment.externalReference,
                amount: totalAmount,
                currency: payment.currency,
                status: payment.status,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * Obtiene el estado de un pago
 */
export async function getPaymentStatus(req, res, next) {
    try {
        const { paymentId } = req.params;
        const payment = await prisma.gatewayPayment.findUnique({
            where: { id: paymentId },
            include: {
                gateway: true,
                order: true,
            },
        });
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Pago no encontrado',
            });
        }
        res.json({
            success: true,
            data: {
                id: payment.id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                externalId: payment.externalId,
                checkoutUrl: payment.checkoutUrl,
                orderNumber: payment.order.numeroOrden,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
}
