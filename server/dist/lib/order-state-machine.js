/**
 * Sistema de Estados de Pedidos - Máquina de Estados y Transiciones
 *
 * Este archivo define la lógica de transiciones válidas entre estados de pedidos,
 * validaciones y reglas de negocio.
 */
// ============================================================================
// MÁQUINA DE ESTADOS - TRANSICIONES VÁLIDAS
// ============================================================================
/**
 * Define las transiciones válidas desde cada estado.
 * Cada estado tiene un array de estados a los que puede transicionar.
 */
export const STATE_TRANSITIONS = {
    // Estados iniciales
    PENDING: [
        'PAYMENT_APPROVED',
        'PAYMENT_REJECTED',
        'CANCELLED'
    ],
    PAYMENT_REJECTED: [], // Estado final
    // Estados de preparación
    PAYMENT_APPROVED: [
        'PREPARING',
        'CANCELLED'
    ],
    PREPARING: [
        'READY_FOR_SHIPPING', // Si fulfillmentType = 'shipping'
        'READY_FOR_PICKUP', // Si fulfillmentType = 'pickup'
        'CANCELLED'
    ],
    // Estados pre-envío
    READY_FOR_SHIPPING: [
        'IN_TRANSIT',
        'CANCELLED'
    ],
    READY_FOR_PICKUP: [
        'DELIVERED', // Cliente retira
        'CANCELLED'
    ],
    // Estados de tránsito
    IN_TRANSIT: [
        'DELIVERED',
        'NOT_DELIVERED'
    ],
    // Estados finales/especiales
    DELIVERED: [], // Inmutable
    NOT_DELIVERED: [
        'IN_TRANSIT', // Reintentar entrega
        'READY_FOR_PICKUP', // Cambiar a retiro en local (si intentosEntrega >= 2)
        'CANCELLED'
    ],
    CANCELLED: [] // Estado final
};
/**
 * Valida si una transición de estado es válida según las reglas de negocio
 */
export function validateTransition(fromStatus, toStatus, order) {
    // Verificar que la transición esté en la lista de transiciones válidas
    const allowedTransitions = STATE_TRANSITIONS[fromStatus];
    if (!allowedTransitions.includes(toStatus)) {
        return {
            isValid: false,
            error: `Transición no válida: ${fromStatus} → ${toStatus}`
        };
    }
    // Validaciones específicas por transición
    // PREPARING → READY_FOR_SHIPPING requiere fulfillmentType = 'shipping'
    if (fromStatus === 'PREPARING' && toStatus === 'READY_FOR_SHIPPING') {
        if (order.fulfillmentType !== 'shipping') {
            return {
                isValid: false,
                error: 'Solo pedidos con envío a domicilio pueden pasar a READY_FOR_SHIPPING'
            };
        }
    }
    // PREPARING → READY_FOR_PICKUP requiere fulfillmentType = 'pickup'
    if (fromStatus === 'PREPARING' && toStatus === 'READY_FOR_PICKUP') {
        if (order.fulfillmentType !== 'pickup') {
            return {
                isValid: false,
                error: 'Solo pedidos de retiro en tienda pueden pasar a READY_FOR_PICKUP'
            };
        }
    }
    // NOT_DELIVERED → READY_FOR_PICKUP requiere al menos 2 intentos
    if (fromStatus === 'NOT_DELIVERED' && toStatus === 'READY_FOR_PICKUP') {
        if ((order.intentosEntrega || 0) < 2) {
            return {
                isValid: false,
                error: 'Se requieren al menos 2 intentos de entrega fallidos para cambiar a retiro en local'
            };
        }
    }
    // Estados inmutables
    if (fromStatus === 'DELIVERED') {
        return {
            isValid: false,
            error: 'Los pedidos entregados no pueden cambiar de estado'
        };
    }
    if (fromStatus === 'PAYMENT_REJECTED') {
        return {
            isValid: false,
            error: 'Los pedidos con pago rechazado no pueden cambiar de estado'
        };
    }
    return { isValid: true };
}
/**
 * Obtiene los próximos estados válidos para un pedido dado
 */
export function getAvailableTransitions(order) {
    const currentStatus = order.cmsStatus;
    if (!currentStatus)
        return [];
    const possibleTransitions = STATE_TRANSITIONS[currentStatus] || [];
    // Filtrar transiciones según validaciones
    return possibleTransitions.filter(nextStatus => {
        const validation = validateTransition(currentStatus, nextStatus, order);
        return validation.isValid;
    });
}
// ============================================================================
// ESTADOS FINALES E INMUTABLES
// ============================================================================
/**
 * Estados que son finales y no permiten más transiciones
 */
export const FINAL_STATUSES = [
    'DELIVERED',
    'PAYMENT_REJECTED',
    'CANCELLED'
];
/**
 * Verifica si un estado es final (sin transiciones posibles)
 */
export function isFinalStatus(status) {
    return FINAL_STATUSES.includes(status);
}
/**
 * Estados que son inmutables (no pueden cambiar una vez alcanzados)
 */
export const IMMUTABLE_STATUSES = [
    'DELIVERED',
    'PAYMENT_REJECTED'
];
/**
 * Verifica si un estado es inmutable
 */
export function isImmutableStatus(status) {
    return IMMUTABLE_STATUSES.includes(status);
}
// ============================================================================
// FLUJOS ESPECÍFICOS POR TIPO DE ENTREGA
// ============================================================================
/**
 * Flujo esperado para pedidos con envío a domicilio
 */
export const SHIPPING_FLOW = [
    'PENDING',
    'PAYMENT_APPROVED',
    'PREPARING',
    'READY_FOR_SHIPPING',
    'IN_TRANSIT',
    'DELIVERED'
];
/**
 * Flujo esperado para pedidos con retiro en tienda
 */
export const PICKUP_FLOW = [
    'PENDING',
    'PAYMENT_APPROVED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'DELIVERED'
];
/**
 * Obtiene el flujo esperado según el tipo de entrega
 */
export function getExpectedFlow(fulfillmentType) {
    return fulfillmentType === 'pickup' ? PICKUP_FLOW : SHIPPING_FLOW;
}
/**
 * Calcula el progreso del pedido como porcentaje
 */
export function calculateProgress(currentStatus, fulfillmentType) {
    const flow = getExpectedFlow(fulfillmentType);
    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex === -1)
        return 0;
    if (currentStatus === 'DELIVERED')
        return 100;
    return Math.round((currentIndex / (flow.length - 1)) * 100);
}
/**
 * Define qué campos son requeridos para cada transición
 */
export const REQUIRED_FIELDS_BY_TRANSITION = {
    'IN_TRANSIT->NOT_DELIVERED': {
        deliveryReason: true,
    },
    'PENDING->CANCELLED': {
        cancellationReason: true,
    },
    'PAYMENT_APPROVED->CANCELLED': {
        cancellationReason: true,
    },
    'PREPARING->CANCELLED': {
        cancellationReason: true,
    },
    'READY_FOR_SHIPPING->IN_TRANSIT': {
    // trackingNumber y courierName son opcionales pero recomendados
    },
};
/**
 * Obtiene los campos requeridos para una transición específica
 */
export function getRequiredFields(fromStatus, toStatus) {
    const key = `${fromStatus}->${toStatus}`;
    const fieldsMap = REQUIRED_FIELDS_BY_TRANSITION[key];
    if (!fieldsMap)
        return [];
    return Object.entries(fieldsMap)
        .filter(([_, required]) => required)
        .map(([field]) => field);
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Verifica si un pedido requiere confirmación del usuario
 */
export function requiresUserConfirmation(status) {
    return status === 'IN_TRANSIT' || status === 'READY_FOR_PICKUP';
}
/**
 * Verifica si un estado permite cancelación
 */
export function canBeCancelled(status) {
    return ![
        'DELIVERED',
        'PAYMENT_REJECTED',
        'CANCELLED',
        'IN_TRANSIT' // No se puede cancelar una vez despachado
    ].includes(status);
}
/**
 * Verifica si un estado es de "en progreso" (ni inicial ni final)
 */
export function isInProgress(status) {
    return ![
        'PENDING',
        'PAYMENT_REJECTED',
        'DELIVERED',
        'NOT_DELIVERED',
        'CANCELLED'
    ].includes(status);
}
export default {
    STATE_TRANSITIONS,
    validateTransition,
    getAvailableTransitions,
    isFinalStatus,
    isImmutableStatus,
    getExpectedFlow,
    calculateProgress,
    getRequiredFields,
    requiresUserConfirmation,
    canBeCancelled,
    isInProgress,
    SHIPPING_FLOW,
    PICKUP_FLOW,
    FINAL_STATUSES,
    IMMUTABLE_STATUSES,
};
