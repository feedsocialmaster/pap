/**
 * Tipos compartidos para el sistema de estados de pedidos - Backend
 * Complementa los tipos del frontend y contiene lógica específica del servidor
 */

import { CMSOrderStatus, Order, EstadoEntrega } from '@prisma/client';

// ============================================================================
// TIPOS EXTENDIDOS PARA EL BACKEND
// ============================================================================

export interface ExtendedOrder extends Order {
  usuario: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
  };
  items: Array<{
    id: string;
    productId: string;
    cantidad: number;
    talle: number;
    color?: string;
    precioUnitario: number;
    product: {
      id: string;
      nombre: string;
      precio: number;
    };
  }>;
  payment?: unknown;
  gatewayPayments?: unknown[];
}

// ============================================================================
// INTERFACES PARA OPERACIONES
// ============================================================================

export interface UpdateOrderStatusParams {
  orderId: string;
  newStatus: CMSOrderStatus;
  deliveryReason?: string;
  cancellationReason?: string;
  trackingNumber?: string;
  courierName?: string;
  changedBy: string;
  changedByEmail?: string;
  notes?: string;
}

export interface OrderStatusTransitionResult {
  success: boolean;
  order: ExtendedOrder;
  previousStatus: CMSOrderStatus;
  newStatus: CMSOrderStatus;
  message?: string;
}

export interface OrderFilterParams {
  status?: CMSOrderStatus[];
  fulfillmentType?: ('shipping' | 'pickup')[];
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// VALIDACIONES Y REGLAS
// ============================================================================

export interface TransitionRule {
  from: CMSOrderStatus;
  to: CMSOrderStatus;
  requiredFields?: (keyof UpdateOrderStatusParams)[];
  customValidation?: (order: ExtendedOrder, params: UpdateOrderStatusParams) => Promise<boolean>;
  fulfillmentTypeRequired?: 'shipping' | 'pickup';
  minimumAttempts?: number;
}

export const TRANSITION_RULES: TransitionRule[] = [
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

// ============================================================================
// TIMESTAMPS POR TRANSICIÓN
// ============================================================================

export interface TimestampMapping {
  [key: string]: keyof ExtendedOrder;
}

export const TIMESTAMP_FIELDS_BY_STATUS: Partial<Record<CMSOrderStatus, keyof ExtendedOrder>> = {
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
export const STATUS_TO_ESTADO_ENTREGA: Partial<Record<CMSOrderStatus, EstadoEntrega>> = {
  PAYMENT_APPROVED: 'PREPARANDO',
  PREPARING: 'PREPARANDO', 
  READY_FOR_SHIPPING: 'PREPARANDO',
  READY_FOR_PICKUP: 'PREPARANDO',
  IN_TRANSIT: 'EN_CAMINO',
  DELIVERED: 'ENTREGADO',
  NOT_DELIVERED: 'VISITADO_NO_ENTREGADO',
  CANCELLED: 'CANCELADO',
};

// ============================================================================
// MÉTRICAS Y REPORTES
// ============================================================================

export interface OrderMetrics {
  // Tiempos promedio por estado (en horas)
  avgTimeToPaymentApproval: number;
  avgPreparationTime: number;
  avgShippingTime: number;
  avgTotalDeliveryTime: number;
  
  // Tasas de éxito (porcentajes)
  deliverySuccessRate: number;
  cancellationRate: number;
  
  // Contadores por estado
  ordersByStatus: Record<CMSOrderStatus, number>;
  
  // Por método de entrega
  ordersByFulfillmentType: {
    shipping: number;
    pickup: number;
  };
  
  // Problemas comunes
  topDeliveryFailureReasons: Array<{
    reason: string;
    count: number;
  }>;
}

export interface StatusDashboard {
  pending: number;              // PENDING
  needsApproval: number;        // PAYMENT_REJECTED que podrían reprocessarse
  inPreparation: number;        // PREPARING
  readyToDispatch: number;      // READY_FOR_SHIPPING
  readyForPickup: number;       // READY_FOR_PICKUP
  inTransit: number;            // IN_TRANSIT
  delivered: number;            // DELIVERED (últimas 24h)
  problemOrders: number;        // NOT_DELIVERED + alta prioridad
}

// ============================================================================
// NOTIFICACIONES BACKEND
// ============================================================================

export interface OrderNotificationData {
  orderId: string;
  numeroOrden: string;
  previousStatus: CMSOrderStatus;
  newStatus: CMSOrderStatus;
  customerEmail: string;
  customerName: string;
  total: number;
  deliveryReason?: string;
  cancellationReason?: string;
  trackingNumber?: string;
  courierName?: string;
  timestamp: Date;
}

export interface NotificationTemplate {
  subject: string;
  text: string;
  html?: string;
}

export const EMAIL_TEMPLATES: Record<string, NotificationTemplate> = {
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

// ============================================================================
// PERMISOS Y ROLES
// ============================================================================

export interface RolePermissions {
  canApprovePayment: boolean;
  canStartPreparation: boolean;
  canMarkReady: boolean;
  canDispatch: boolean;
  canMarkDelivered: boolean;
  canCancel: boolean;
  canViewMetrics: boolean;
  canEditTracking: boolean;
}

export const PERMISSIONS_BY_ROLE: Record<string, RolePermissions> = {
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

export function hasPermissionForAction(
  userRole: string,
  action: 'approve_payment' | 'start_preparation' | 'mark_ready' | 'dispatch' | 'mark_delivered' | 'cancel' | 'view_metrics' | 'edit_tracking'
): boolean {
  const permissions = PERMISSIONS_BY_ROLE[userRole];
  if (!permissions) return false;
  
  const permissionKey = action.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  const fullKey = `can${permissionKey.charAt(0).toUpperCase()}${permissionKey.slice(1)}`;
  
  return (permissions as any)[fullKey] || false;
}

export function getTimestampFieldForStatus(status: CMSOrderStatus): keyof ExtendedOrder | null {
  return TIMESTAMP_FIELDS_BY_STATUS[status] || null;
}

export function getEstadoEntregaForStatus(status: CMSOrderStatus): EstadoEntrega | null {
  return STATUS_TO_ESTADO_ENTREGA[status] || null;
}

export function isTransitionValid(from: CMSOrderStatus, to: CMSOrderStatus): boolean {
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