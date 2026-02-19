/**
 * Tipos compartidos para el sistema de estados de pedidos
 * Usado tanto en frontend como backend
 */

// Enum local que refleja CMSOrderStatus de Prisma (evita dependencia directa de @prisma/client en frontend)
export type CMSOrderStatus =
  | 'PENDING'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_APPROVED'
  | 'PREPARING'
  | 'READY_FOR_SHIPPING'
  | 'READY_FOR_PICKUP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'NOT_DELIVERED'
  | 'CANCELLED'
  | 'INVENTORY_ERROR';

// ============================================================================
// TIPOS BASE
// ============================================================================

export type FulfillmentType = 'shipping' | 'pickup';

export type OrderStatusType = CMSOrderStatus;

// ============================================================================
// CONFIGURACIÓN DE UI PARA ESTADOS
// ============================================================================

export interface StatusUIConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

export const STATUS_UI_CONFIG: Record<CMSOrderStatus, StatusUIConfig> = {
  PENDING: {
    label: 'Pendiente',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    icon: 'Clock',
    description: 'Esperando confirmación de pago'
  },
  
  PAYMENT_REJECTED: {
    label: 'Pago Rechazado',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'AlertCircle',
    description: 'El pago fue rechazado'
  },
  
  PAYMENT_APPROVED: {
    label: 'Pago Aprobado',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: 'CheckCircle',
    description: 'Pago confirmado, listo para preparar'
  },
  
  PREPARING: {
    label: 'Preparando',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    icon: 'Package',
    description: 'Estamos preparando tu pedido'
  },
  
  READY_FOR_SHIPPING: {
    label: 'Listo para Envío',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-300',
    icon: 'PackageCheck',
    description: 'Pedido empaquetado, listo para despachar'
  },
  
  READY_FOR_PICKUP: {
    label: 'Listo para Retiro',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    icon: 'MapPin',
    description: 'Pedido listo, retíralo en nuestra tienda'
  },
  
  IN_TRANSIT: {
    label: 'En Camino',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    icon: 'Truck',
    description: 'Tu pedido está en camino'
  },
  
  DELIVERED: {
    label: 'Entregado',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: 'CheckCircle2',
    description: 'Pedido entregado exitosamente'
  },
  
  NOT_DELIVERED: {
    label: 'No Entregado',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'XCircle',
    description: 'No se pudo completar la entrega'
  },
  
  CANCELLED: {
    label: 'Cancelado',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    icon: 'Ban',
    description: 'Pedido cancelado'
  },
  
  INVENTORY_ERROR: {
    label: 'Error de Inventario',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'AlertTriangle',
    description: 'Error al procesar inventario'
  }
};

// ============================================================================
// CONFIGURACIÓN DE ACCIONES POR ESTADO
// ============================================================================

export interface StatusActionConfig {
  action: string;
  label: string;
  nextStatus: CMSOrderStatus;
  icon: string;
  variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  requiresConfirmation?: boolean;
  requiresReason?: boolean;
  showIf?: (order: any) => boolean;
  additionalFields?: Array<{
    name: string;
    label: string;
    required?: boolean;
    optional?: boolean;
  }>;
}

export const ACTIONS_BY_STATUS: Record<CMSOrderStatus, StatusActionConfig[]> = {
  PENDING: [
    {
      action: 'APPROVE_PAYMENT',
      label: 'Aprobar Pago',
      nextStatus: 'PAYMENT_APPROVED',
      icon: 'CheckCircle',
      variant: 'success',
      requiresConfirmation: true,
    },
    {
      action: 'REJECT_PAYMENT',
      label: 'Rechazar Pago',
      nextStatus: 'PAYMENT_REJECTED',
      icon: 'XCircle',
      variant: 'danger',
      requiresConfirmation: true,
    },
    {
      action: 'CANCEL',
      label: 'Cancelar Pedido',
      nextStatus: 'CANCELLED',
      icon: 'Ban',
      variant: 'secondary',
      requiresConfirmation: true,
      requiresReason: true,
    }
  ],
  
  PAYMENT_APPROVED: [
    {
      action: 'START_PREPARING',
      label: 'Iniciar Preparación',
      nextStatus: 'PREPARING',
      icon: 'Play',
      variant: 'primary',
    },
    {
      action: 'CANCEL',
      label: 'Cancelar Pedido',
      nextStatus: 'CANCELLED',
      icon: 'Ban',
      variant: 'secondary',
      requiresConfirmation: true,
      requiresReason: true,
    }
  ],
  
  PREPARING: [
    {
      action: 'MARK_READY_SHIPPING',
      label: 'Marcar Listo para Envío',
      nextStatus: 'READY_FOR_SHIPPING',
      icon: 'PackageCheck',
      variant: 'success',
      showIf: (order) => order.fulfillmentType === 'shipping',
    },
    {
      action: 'MARK_READY_PICKUP',
      label: 'Marcar Listo para Retiro',
      nextStatus: 'READY_FOR_PICKUP',
      icon: 'MapPin',
      variant: 'success',
      showIf: (order) => order.fulfillmentType === 'pickup',
    },
    {
      action: 'CANCEL',
      label: 'Cancelar Pedido',
      nextStatus: 'CANCELLED',
      icon: 'Ban',
      variant: 'secondary',
      requiresConfirmation: true,
      requiresReason: true,
    }
  ],
  
  READY_FOR_SHIPPING: [
    {
      action: 'DISPATCH',
      label: 'Despachar Pedido',
      nextStatus: 'IN_TRANSIT',
      icon: 'Truck',
      variant: 'primary',
      additionalFields: [
        { name: 'trackingNumber', label: 'Nro. de Seguimiento', optional: true },
        { name: 'courierName', label: 'Courier', optional: true },
      ],
    },
    {
      action: 'CANCEL',
      label: 'Cancelar Pedido',
      nextStatus: 'CANCELLED',
      icon: 'Ban',
      variant: 'secondary',
      requiresConfirmation: true,
      requiresReason: true,
    }
  ],
  
  READY_FOR_PICKUP: [
    {
      action: 'MARK_DELIVERED',
      label: 'Cliente Retiró',
      nextStatus: 'DELIVERED',
      icon: 'CheckCircle2',
      variant: 'success',
      requiresConfirmation: true,
    },
    {
      action: 'CANCEL',
      label: 'Cancelar Pedido',
      nextStatus: 'CANCELLED',
      icon: 'Ban',
      variant: 'secondary',
      requiresConfirmation: true,
      requiresReason: true,
    }
  ],
  
  IN_TRANSIT: [
    {
      action: 'MARK_DELIVERED',
      label: 'Marcar como Entregado',
      nextStatus: 'DELIVERED',
      icon: 'CheckCircle2',
      variant: 'success',
      requiresConfirmation: true,
    },
    {
      action: 'MARK_NOT_DELIVERED',
      label: 'No Pudo Entregarse',
      nextStatus: 'NOT_DELIVERED',
      icon: 'XCircle',
      variant: 'danger',
      requiresReason: true,
      additionalFields: [
        { name: 'deliveryReason', label: 'Motivo', required: true },
      ],
    }
  ],
  
  NOT_DELIVERED: [
    {
      action: 'RETRY_DELIVERY',
      label: 'Reintentar Entrega',
      nextStatus: 'IN_TRANSIT',
      icon: 'RotateCcw',
      variant: 'primary',
    },
    {
      action: 'CONVERT_TO_PICKUP',
      label: 'Cambiar a Retiro en Local',
      nextStatus: 'READY_FOR_PICKUP',
      icon: 'MapPin',
      variant: 'secondary',
      showIf: (order) => (order.intentosEntrega || 0) >= 2,
    },
    {
      action: 'CANCEL',
      label: 'Cancelar Pedido',
      nextStatus: 'CANCELLED',
      icon: 'Ban',
      variant: 'secondary',
      requiresConfirmation: true,
      requiresReason: true,
    }
  ],
  
  // Estados finales sin acciones
  DELIVERED: [],
  PAYMENT_REJECTED: [],
  CANCELLED: [],
  INVENTORY_ERROR: [],
};

// ============================================================================
// NOTIFICACIONES POR ESTADO
// ============================================================================

export interface StateNotification {
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export const NOTIFICATIONS_BY_TRANSITION: Record<string, StateNotification> = {
  'PENDING->PAYMENT_APPROVED': {
    title: '✅ Pago Aprobado',
    message: 'Tu pago ha sido confirmado. Pronto comenzaremos a preparar tu pedido.',
    type: 'success'
  },
  'PAYMENT_APPROVED->PREPARING': {
    title: '📦 Preparando tu Pedido',
    message: '¡Buenas noticias! Estamos preparando tu pedido #{numeroOrden}.',
    type: 'info'
  },
  'PREPARING->READY_FOR_SHIPPING': {
    title: '✅ Pedido Listo',
    message: 'Tu pedido está listo y será despachado pronto.',
    type: 'info'
  },
  'PREPARING->READY_FOR_PICKUP': {
    title: '🏪 Listo para Retiro',
    message: 'Tu pedido está listo. Puedes retirarlo en nuestra tienda.',
    type: 'success'
  },
  'READY_FOR_SHIPPING->IN_TRANSIT': {
    title: '🚚 En Camino',
    message: '¡Tu pedido está en camino! Pronto estará en tus manos.',
    type: 'info'
  },
  'IN_TRANSIT->DELIVERED': {
    title: '✅ Entregado',
    message: 'Tu pedido ha sido marcado como entregado. ¿Lo recibiste?',
    type: 'success'
  },
  'READY_FOR_PICKUP->DELIVERED': {
    title: '✅ Retirado',
    message: 'Gracias por retirar tu pedido. ¡Esperamos que lo disfrutes!',
    type: 'success'
  },
  'IN_TRANSIT->NOT_DELIVERED': {
    title: '❌ Problema en la Entrega',
    message: 'No pudimos entregar tu pedido. Motivo: {deliveryReason}',
    type: 'warning'
  },
  '*->CANCELLED': {
    title: '🚫 Pedido Cancelado',
    message: 'Tu pedido ha sido cancelado.',
    type: 'error'
  },
};

// ============================================================================
// HELPERS PARA UI
// ============================================================================

export function getStatusColor(status: CMSOrderStatus): string {
  return STATUS_UI_CONFIG[status]?.textColor || 'text-gray-600';
}

export function getStatusLabel(status: CMSOrderStatus): string {
  return STATUS_UI_CONFIG[status]?.label || status;
}

export function getStatusIcon(status: CMSOrderStatus): string {
  return STATUS_UI_CONFIG[status]?.icon || 'AlertCircle';
}

export function getStatusDescription(status: CMSOrderStatus): string {
  return STATUS_UI_CONFIG[status]?.description || 'Estado del pedido';
}

export function getAvailableActions(status: CMSOrderStatus, order?: any): StatusActionConfig[] {
  const actions = ACTIONS_BY_STATUS[status] || [];
  if (!order) return actions;
  
  return actions.filter(action => {
    if (action.showIf && typeof action.showIf === 'function') {
      return action.showIf(order);
    }
    return true;
  });
}

export function getNotificationForTransition(
  fromStatus: CMSOrderStatus,
  toStatus: CMSOrderStatus,
  orderData?: any
): StateNotification | null {
  const key = `${fromStatus}->${toStatus}`;
  let notification = NOTIFICATIONS_BY_TRANSITION[key];
  
  // Fallback para cancelaciones
  if (!notification && toStatus === 'CANCELLED') {
    notification = NOTIFICATIONS_BY_TRANSITION['*->CANCELLED'];
  }
  
  if (!notification) return null;
  
  // Reemplazar placeholders en el mensaje
  let message = notification.message;
  if (orderData?.numeroOrden) {
    message = message.replace('{numeroOrden}', orderData.numeroOrden);
  }
  if (orderData?.deliveryReason) {
    message = message.replace('{deliveryReason}', orderData.deliveryReason);
  }
  
  return {
    ...notification,
    message
  };
}

// ============================================================================
// TIPOS PARA TRACKING Y PROGRESO
// ============================================================================

export interface TrackingStep {
  number: number;
  title: string;
  description: string;
  icon: string;
  status?: 'completed' | 'current' | 'pending';
  timestamp?: string;
}

export interface OrderProgress {
  percentage: number;
  currentStep: number;
  steps: TrackingStep[];
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  STATUS_UI_CONFIG,
  ACTIONS_BY_STATUS,
  NOTIFICATIONS_BY_TRANSITION,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
  getStatusDescription,
  getAvailableActions,
  getNotificationForTransition,
};