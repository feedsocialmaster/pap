/**
 * Servicio de Inventario
 *
 * Gestiona todas las operaciones relacionadas con el stock de productos:
 * - Validación de stock disponible
 * - Reducción de stock al confirmar pagos
 * - Reposición de stock al cancelar pedidos
 * - Sincronización de stock total del producto
 */
import { prisma } from '../prisma.js';
// Estados de pedido que se consideran como "venta confirmada"
// Solo estos estados deberían contar para las estadísticas de "vendidos"
export const CONFIRMED_ORDER_STATUSES = [
    'PAYMENT_APPROVED',
    'PREPARING',
    'READY_FOR_SHIPPING',
    'READY_FOR_PICKUP',
    'IN_TRANSIT',
    'DELIVERED',
];
// Estados finales negativos donde se debe reponer el stock
export const REFUNDABLE_ORDER_STATUSES = [
    'CANCELLED',
    'PAYMENT_REJECTED',
];
/**
 * Valida que hay suficiente stock para todos los items del pedido
 * Usa el stock de variantes (color + talle) si existen, o el stock general
 */
export async function validateStockAvailability(items, tx) {
    const client = tx || prisma;
    const insufficientItems = [];
    for (const item of items) {
        const product = await client.product.findUnique({
            where: { id: item.productId },
            include: { variants: true },
        });
        if (!product) {
            insufficientItems.push({
                productId: item.productId,
                productName: 'Producto no encontrado',
                color: item.color || '',
                size: item.talle,
                available: 0,
                requested: item.cantidad,
            });
            continue;
        }
        // Si tiene variantes y se especificó color, validar stock de la variante específica
        if (product.variants.length > 0 && item.color) {
            const variant = product.variants.find(v => v.colorCode === item.color && v.size === item.talle);
            if (!variant) {
                insufficientItems.push({
                    productId: item.productId,
                    productName: product.nombre,
                    color: item.color,
                    size: item.talle,
                    available: 0,
                    requested: item.cantidad,
                });
            }
            else if (variant.stock < item.cantidad) {
                insufficientItems.push({
                    productId: item.productId,
                    productName: product.nombre,
                    color: item.color,
                    size: item.talle,
                    available: variant.stock,
                    requested: item.cantidad,
                });
            }
        }
        else {
            // Sin variantes, usar stock general
            if (product.stock < item.cantidad) {
                insufficientItems.push({
                    productId: item.productId,
                    productName: product.nombre,
                    color: item.color || '',
                    size: item.talle,
                    available: product.stock,
                    requested: item.cantidad,
                });
            }
        }
    }
    return {
        isValid: insufficientItems.length === 0,
        insufficientItems,
    };
}
/**
 * Reduce el stock para los items de un pedido
 * Debe llamarse dentro de una transacción
 */
export async function reduceStock(items, tx) {
    for (const item of items) {
        const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { variants: true },
        });
        if (!product)
            continue;
        // Si tiene variantes y el item tiene color, reducir de la variante específica
        if (product.variants.length > 0 && item.color) {
            const variant = product.variants.find(v => v.colorCode === item.color && v.size === item.talle);
            if (variant) {
                const newStock = Math.max(0, variant.stock - item.cantidad);
                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: { stock: newStock },
                });
                console.log(`📦 [Inventory] Reducido stock variante ${variant.id}: ${variant.stock} -> ${newStock}`);
            }
            // Recalcular y actualizar stock total del producto
            await syncProductStockFromVariants(item.productId, tx);
        }
        else {
            // Sin variantes, reducir stock general
            const newStock = Math.max(0, product.stock - item.cantidad);
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: newStock,
                    stockTotal: newStock,
                },
            });
            console.log(`📦 [Inventory] Reducido stock producto ${product.id}: ${product.stock} -> ${newStock}`);
        }
    }
}
/**
 * Repone el stock para los items de un pedido cancelado/rechazado
 * Debe llamarse dentro de una transacción
 */
export async function restoreStock(items, tx) {
    for (const item of items) {
        const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { variants: true },
        });
        if (!product)
            continue;
        // Si tiene variantes y el item tiene color, restaurar en la variante específica
        if (product.variants.length > 0 && item.color) {
            const variant = product.variants.find(v => v.colorCode === item.color && v.size === item.talle);
            if (variant) {
                const newStock = variant.stock + item.cantidad;
                await tx.productVariant.update({
                    where: { id: variant.id },
                    data: { stock: newStock },
                });
                console.log(`📦 [Inventory] Restaurado stock variante ${variant.id}: ${variant.stock} -> ${newStock}`);
            }
            // Recalcular y actualizar stock total del producto
            await syncProductStockFromVariants(item.productId, tx);
        }
        else {
            // Sin variantes, restaurar stock general
            const newStock = product.stock + item.cantidad;
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: newStock,
                    stockTotal: newStock,
                },
            });
            console.log(`📦 [Inventory] Restaurado stock producto ${product.id}: ${product.stock} -> ${newStock}`);
        }
    }
}
/**
 * Sincroniza el stock total del producto desde sus variantes
 */
export async function syncProductStockFromVariants(productId, tx) {
    const client = tx || prisma;
    const variants = await client.productVariant.findMany({
        where: { productId },
        select: { stock: true },
    });
    const stockTotal = variants.reduce((sum, v) => sum + v.stock, 0);
    await client.product.update({
        where: { id: productId },
        data: {
            stock: stockTotal,
            stockTotal: stockTotal,
        },
    });
    console.log(`📦 [Inventory] Sincronizado stock producto ${productId}: ${stockTotal} unidades`);
    return stockTotal;
}
/**
 * Obtiene las unidades vendidas de un producto (solo pedidos confirmados)
 */
export async function getConfirmedSoldUnits(productId) {
    const result = await prisma.orderItem.aggregate({
        where: {
            productId,
            order: {
                cmsStatus: {
                    in: CONFIRMED_ORDER_STATUSES,
                },
            },
        },
        _sum: {
            cantidad: true,
        },
    });
    return result._sum.cantidad || 0;
}
/**
 * Obtiene las unidades vendidas por variante (solo pedidos confirmados)
 */
export async function getConfirmedSoldUnitsByVariant(productId, colorCode, size) {
    const result = await prisma.orderItem.aggregate({
        where: {
            productId,
            color: colorCode,
            talle: size,
            order: {
                cmsStatus: {
                    in: CONFIRMED_ORDER_STATUSES,
                },
            },
        },
        _sum: {
            cantidad: true,
        },
    });
    return result._sum.cantidad || 0;
}
/**
 * Verifica si un pedido ya tuvo su stock reducido
 * Se basa en si el pago fue aprobado o si está en un estado posterior
 */
export async function wasStockAlreadyReduced(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { cmsStatus: true },
    });
    if (!order)
        return false;
    // El stock se reduce solo cuando el pago es aprobado
    // Si el pedido está en PENDING o PAYMENT_REJECTED, el stock no se ha reducido
    return CONFIRMED_ORDER_STATUSES.includes(order.cmsStatus);
}
export const inventoryService = {
    validateStockAvailability,
    reduceStock,
    restoreStock,
    syncProductStockFromVariants,
    getConfirmedSoldUnits,
    getConfirmedSoldUnitsByVariant,
    wasStockAlreadyReduced,
    CONFIRMED_ORDER_STATUSES,
    REFUNDABLE_ORDER_STATUSES,
};
