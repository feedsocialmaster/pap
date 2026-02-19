/**
 * Tipos compartidos para el sistema de estados de pedidos - Backend
 * Complementa los tipos del frontend y contiene lógica específica del servidor
 */
export const TRANSITION_RULES = [
    // Reglas para preparación
    {
        from: 'PREPARING',
        to: 'READY_FOR_SHIPPING',
        fulfillmentTypeRequired: 'shipping',
    },
    {
        from: 'PREPARING',
        to: 'READY_FOR_PICKUP',
        fulfillmentTypeRequired: 'pickup',
    },
    // Reglas para entrega fallida
    {
        from: 'IN_TRANSIT',
        to: 'NOT_DELIVERED',
        requiredFields: ['deliveryReason'],
    },
    // Reglas para cancelación
    {
        from: 'PENDING',
        to: 'CANCELLED',
        requiredFields: ['cancellationReason'],
    },
    {
        from: 'PAYMENT_APPROVED',
        to: 'CANCELLED',
        requiredFields: ['cancellationReason'],
    },
    {
        from: 'PREPARING',
        to: 'CANCELLED',
        requiredFields: ['cancellationReason'],
    },
    // Regla para cambio a pickup después de intentos fallidos
    {
        from: 'NOT_DELIVERED',
        to: 'READY_FOR_PICKUP',
        minimumAttempts: 2,
    },
];
export const TIMESTAMP_FIELDS_BY_STATUS = {
    PAYMENT_APPROVED: 'paymentApprovedAt',
    PREPARING: 'preparingStartedAt',
    READY_FOR_SHIPPING: 'readyForShippingAt',
    READY_FOR_PICKUP: 'readyForPickupAt',
    IN_TRANSIT: 'shippedAt',
    DELIVERED: 'deliveredAt',
};
// ============================================================================
// MAPEO CON EstadoEntrega LEGACY
// ============================================================================
/**
 * Mapeo entre CMSOrderStatus (nuevo) y EstadoEntrega (legacy)
 * Para mantener compatibilidad con el sistema existente
 */
export const STATUS_TO_ESTADO_ENTREGA = {
    PAYMENT_APPROVED: 'PREPARANDO',
    PREPARING: 'PREPARANDO',
    READY_FOR_SHIPPING: 'PREPARANDO',
    READY_FOR_PICKUP: 'PREPARANDO',
    IN_TRANSIT: 'EN_CAMINO',
    DELIVERED: 'ENTREGADO',
    NOT_DELIVERED: 'VISITADO_NO_ENTREGADO',
    CANCELLED: 'CANCELADO',
};
export const EMAIL_TEMPLATES = {
    'PENDING->PAYMENT_APPROVED': {
        subject: 'Pago Confirmado - Pedido #{numeroOrden}',
        text: 'Hola {customerName}, tu pago ha sido confirmado. Pronto comenzaremos a preparar tu pedido.'
    },
    'PAYMENT_APPROVED->PREPARING': {
        subject: 'Preparando tu Pedido - #{numeroOrden}',
        text: 'Hola {customerName}, ¡buenas noticias! Estamos preparando tu pedido #{numeroOrden}.'
    },
    'PREPARING->READY_FOR_PICKUP': {
        subject: 'Pedido Listo para Retiro - #{numeroOrden}',
        text: 'Hola {customerName}, tu pedido está listo. Puedes retirarlo en nuestra tienda.'
    },
    'READY_FOR_SHIPPING->IN_TRANSIT': {
        subject: 'Pedido en Camino - #{numeroOrden}',
        text: 'Hola {customerName}, ¡tu pedido está en camino! {trackingInfo}'
    },
    'IN_TRANSIT->DELIVERED': {
        subject: 'Pedido Entregado - #{numeroOrden}',
        text: 'Hola {customerName}, tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!'
    },
};
export const PERMISSIONS_BY_ROLE = {
    ADMIN_CMS: {
        canApprovePayment: true,
        canStartPreparation: true,
        canMarkReady: true,
        canDispatch: true,
        canMarkDelivered: true,
        canCancel: true,
        canViewMetrics: true,
        canEditTracking: true,
    },
    VENDEDOR: {
        canApprovePayment: false,
        canStartPreparation: true,
        canMarkReady: true,
        canDispatch: true,
        canMarkDelivered: true,
        canCancel: false,
        canViewMetrics: true,
        canEditTracking: false,
    },
    GERENTE_COMERCIAL: {
        canApprovePayment: true,
        canStartPreparation: true,
        canMarkReady: true,
        canDispatch: true,
        canMarkDelivered: true,
        canCancel: true,
        canViewMetrics: true,
        canEditTracking: true,
    },
    DUENA: {
        canApprovePayment: true,
        canStartPreparation: true,
        canMarkReady: true,
        canDispatch: true,
        canMarkDelivered: true,
        canCancel: true,
        canViewMetrics: true,
        canEditTracking: true,
    },
    SUPER_SU: {
        canApprovePayment: true,
        canStartPreparation: true,
        canMarkReady: true,
        canDispatch: true,
        canMarkDelivered: true,
        canCancel: true,
        canViewMetrics: true,
        canEditTracking: true,
    },
};
// ============================================================================
// HELPERS
// ============================================================================
export function hasPermissionForAction(userRole, action) {
    const permissions = PERMISSIONS_BY_ROLE[userRole];
    if (!permissions)
        return false;
    const permissionKey = action.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const fullKey = `can${permissionKey.charAt(0).toUpperCase()}${permissionKey.slice(1)}`;
    return permissions[fullKey] || false;
}
export function getTimestampFieldForStatus(status) {
    return TIMESTAMP_FIELDS_BY_STATUS[status] || null;
}
export function getEstadoEntregaForStatus(status) {
    return STATUS_TO_ESTADO_ENTREGA[status] || null;
}
export function isTransitionValid(from, to) {
    // Importar la lógica del order-state-machine
    const { STATE_TRANSITIONS } = require('../lib/order-state-machine');
    const allowedTransitions = STATE_TRANSITIONS[from];
    return allowedTransitions?.includes(to) || false;
}
export default {
    TRANSITION_RULES,
    TIMESTAMP_FIELDS_BY_STATUS,
    STATUS_TO_ESTADO_ENTREGA,
    EMAIL_TEMPLATES,
    PERMISSIONS_BY_ROLE,
    hasPermissionForAction,
    getTimestampFieldForStatus,
    getEstadoEntregaForStatus,
    isTransitionValid,
};
