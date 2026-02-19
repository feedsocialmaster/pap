'use client';

import { useState, useCallback, useMemo } from 'react';
import { Order } from '@/store/realtimeStore';
import {
  STATUS_UI_CONFIG,
  getStatusLabel,
  getStatusColor,
  getStatusDescription,
  getAvailableActions,
  StatusActionConfig,
} from '@/types/order-status';
import {
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Package,
  PackageCheck,
  MapPin,
  Truck,
  Ban,
  Play,
  RotateCcw,
  ChevronRight,
  Info,
  Loader2,
} from 'lucide-react';

// ============================================================================
// ICON MAPPER
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Package,
  PackageCheck,
  MapPin,
  Truck,
  Ban,
  Play,
  RotateCcw,
};

function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || AlertCircle;
}

// ============================================================================
// TYPES
// ============================================================================

interface OrderStatusManagerProps {
  order: Order;
  onStatusChange: (
    orderId: string,
    newStatus: string,
    extraData?: {
      deliveryReason?: string;
      cancellationReason?: string;
      trackingNumber?: string;
      courierName?: string;
      notes?: string;
    }
  ) => Promise<void>;
}

type CMSOrderStatus =
  | 'PENDING'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_APPROVED'
  | 'PREPARING'
  | 'READY_FOR_SHIPPING'
  | 'READY_FOR_PICKUP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'NOT_DELIVERED'
  | 'CANCELLED';

// ============================================================================
// VARIANT CONFIG
// ============================================================================

const VARIANT_STYLES: Record<string, { bg: string; hover: string; text: string }> = {
  primary: {
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-700',
    text: 'text-white',
  },
  secondary: {
    bg: 'bg-gray-200 dark:bg-gray-600',
    hover: 'hover:bg-gray-300 dark:hover:bg-gray-500',
    text: 'text-gray-800 dark:text-white',
  },
  success: {
    bg: 'bg-green-600',
    hover: 'hover:bg-green-700',
    text: 'text-white',
  },
  danger: {
    bg: 'bg-red-600',
    hover: 'hover:bg-red-700',
    text: 'text-white',
  },
  warning: {
    bg: 'bg-yellow-500',
    hover: 'hover:bg-yellow-600',
    text: 'text-white',
  },
};

// ============================================================================
// SHIPPING FLOW ORDER (for timeline)
// ============================================================================

const SHIPPING_FLOW: CMSOrderStatus[] = [
  'PENDING',
  'PAYMENT_APPROVED',
  'PREPARING',
  'READY_FOR_SHIPPING',
  'IN_TRANSIT',
  'DELIVERED',
];

const PICKUP_FLOW: CMSOrderStatus[] = [
  'PENDING',
  'PAYMENT_APPROVED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'DELIVERED',
];

function getFlowForOrder(order: Order): CMSOrderStatus[] {
  return order.fulfillmentType === 'pickup' ? PICKUP_FLOW : SHIPPING_FLOW;
}

// ============================================================================
// STATUS TIMELINE SUB-COMPONENT
// ============================================================================

function StatusTimeline({ order }: { order: Order }) {
  const flow = getFlowForOrder(order);
  const currentStatus = order.cmsStatus as CMSOrderStatus;
  const currentIndex = flow.indexOf(currentStatus);

  // If status is not in the normal flow (e.g., CANCELLED, NOT_DELIVERED), show it at the end
  const isOffTrack = currentIndex === -1;

  const getTimestampForStatus = (status: CMSOrderStatus): string | null => {
    const map: Record<string, string | undefined> = {
      PENDING: order.fecha,
      PAYMENT_APPROVED: order.paymentApprovedAt ?? undefined,
      PREPARING: order.preparingStartedAt ?? undefined,
      READY_FOR_SHIPPING: order.readyForShippingAt ?? undefined,
      READY_FOR_PICKUP: order.readyForPickupAt ?? undefined,
      IN_TRANSIT: order.shippedAt ?? undefined,
      DELIVERED: order.deliveredAt ?? undefined,
    };
    return map[status] || null;
  };

  const formatTimestamp = (ts: string | null): string => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative">
      {flow.map((status, index) => {
        const config = STATUS_UI_CONFIG[status];
        const Icon = getIcon(config.icon);
        const timestamp = getTimestampForStatus(status);
        const isCompleted = !isOffTrack && index < currentIndex;
        const isCurrent = !isOffTrack && index === currentIndex;
        const isPending = !isOffTrack && index > currentIndex;

        return (
          <div key={status} className="flex items-start gap-3 relative">
            {/* Connector line */}
            {index < flow.length - 1 && (
              <div
                className={`absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-10px)] ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-purple-300 dark:bg-purple-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}

            {/* Icon circle */}
            <div
              className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500'
                  : isCurrent
                  ? `${config.bgColor} ring-2 ring-purple-500 dark:ring-purple-400`
                  : 'bg-gray-100 dark:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-600'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Icon
                  className={`w-4 h-4 ${
                    isCurrent
                      ? config.textColor
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
              )}
            </div>

            {/* Details */}
            <div className={`pb-6 flex-1 ${isPending ? 'opacity-50' : ''}`}>
              <p
                className={`text-sm font-medium ${
                  isCurrent
                    ? 'text-purple-700 dark:text-purple-300'
                    : isCompleted
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {config.label}
                {isCurrent && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {status === 'DELIVERED' ? 'Producto(s) Entregado(s)' : 'Actual'}
                  </span>
                )}
              </p>
              {(isCompleted || isCurrent) && timestamp && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  {formatTimestamp(timestamp)}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Off-track status (CANCELLED, NOT_DELIVERED, PAYMENT_REJECTED) */}
      {isOffTrack && (
        <div className="flex items-start gap-3 relative">
          <div
            className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              STATUS_UI_CONFIG[currentStatus].bgColor
            } ring-2 ring-red-500`}
          >
            {(() => {
              const Icon = getIcon(STATUS_UI_CONFIG[currentStatus].icon);
              return <Icon className={`w-4 h-4 ${STATUS_UI_CONFIG[currentStatus].textColor}`} />;
            })()}
          </div>
          <div className="pb-2 flex-1">
            <p className={`text-sm font-medium ${STATUS_UI_CONFIG[currentStatus].textColor}`}>
              {STATUS_UI_CONFIG[currentStatus].label}
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                Actual
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              {STATUS_UI_CONFIG[currentStatus].description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CONFIRMATION DIALOG SUB-COMPONENT
// ============================================================================

interface ConfirmDialogProps {
  action: StatusActionConfig;
  order: Order;
  onConfirm: (extraData: Record<string, string>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmDialog({ action, order, onConfirm, onCancel, isLoading }: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [trackingNumber, setTrackingNumber] = useState((order as any).trackingNumber || '');
  const [courierName, setCourierName] = useState((order as any).courierName || '');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    setValidationError('');

    // Validate required reason
    if (action.requiresReason && !reason.trim()) {
      setValidationError('Debe ingresar un motivo');
      return;
    }

    // Validate required additional fields
    if (action.additionalFields) {
      for (const field of action.additionalFields) {
        if (field.required) {
          if (field.name === 'deliveryReason' && !reason.trim()) {
            setValidationError(`${field.label} es obligatorio`);
            return;
          }
        }
      }
    }

    const extraData: Record<string, string> = {};

    if (reason.trim()) {
      // Determine whether this is a delivery or cancellation reason
      if (action.nextStatus === 'CANCELLED') {
        extraData.cancellationReason = reason.trim();
      } else {
        extraData.deliveryReason = reason.trim();
      }
    }

    if (trackingNumber.trim()) {
      extraData.trackingNumber = trackingNumber.trim();
    }

    if (courierName.trim()) {
      extraData.courierName = courierName.trim();
    }

    if (notes.trim()) {
      extraData.notes = notes.trim();
    }

    onConfirm(extraData);
  };

  const targetConfig = STATUS_UI_CONFIG[action.nextStatus];
  const variant = VARIANT_STYLES[action.variant] || VARIANT_STYLES.primary;

  const hasTrackingFields = action.additionalFields?.some(
    (f) => f.name === 'trackingNumber' || f.name === 'courierName'
  );

  const hasDeliveryReasonField = action.additionalFields?.some(
    (f) => f.name === 'deliveryReason'
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${targetConfig.bgColor}`}>
              {(() => {
                const Icon = getIcon(action.icon);
                return <Icon className={`w-5 h-5 ${targetConfig.textColor}`} />;
              })()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-700 dark:text-white">
                {action.label}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pedido #{order.numeroOrden}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              El estado cambiará de{' '}
              <span className={`font-semibold ${getStatusColor(order.cmsStatus as any)}`}>
                {getStatusLabel(order.cmsStatus as any)}
              </span>
              {' '}a{' '}
              <span className={`font-semibold ${targetConfig.textColor}`}>
                {targetConfig.label}
              </span>
            </span>
          </div>

          {/* Reason field */}
          {(action.requiresReason || hasDeliveryReasonField) && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-white mb-1.5">
                Motivo {action.requiresReason ? '*' : '(opcional)'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-purple-700 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm"
                placeholder={
                  action.nextStatus === 'CANCELLED'
                    ? 'Razón de la cancelación...'
                    : 'Motivo por el que no se pudo entregar...'
                }
              />
            </div>
          )}

          {/* Tracking fields */}
          {hasTrackingFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-white mb-1.5">
                  Nro. Seguimiento
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-purple-700 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Ej: XYZ123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-700 dark:text-white mb-1.5">
                  Courier / Transporte
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-purple-700 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Ej: Andreani, OCA"
                />
              </div>
            </div>
          )}

          {/* Notes - Hidden for DELIVERED status */}
          {action.nextStatus !== 'DELIVERED' && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-white mb-1.5">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-purple-700 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm"
                placeholder="Notas adicionales..."
              />
            </div>
          )}

          {validationError && (
            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-purple-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${variant.bg} ${variant.hover} ${variant.text}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrderStatusManager({ order, onStatusChange }: OrderStatusManagerProps) {
  const [activeAction, setActiveAction] = useState<StatusActionConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const currentStatus = order.cmsStatus as CMSOrderStatus;
  const config = STATUS_UI_CONFIG[currentStatus];
  const actions = useMemo(
    () => getAvailableActions(currentStatus, order),
    [currentStatus, order]
  );

  const handleActionClick = useCallback((action: StatusActionConfig) => {
    if (action.requiresConfirmation || action.requiresReason || action.additionalFields?.length) {
      setActiveAction(action);
    } else {
      // Direct action without confirmation
      performAction(action, {});
    }
  }, []);

  const performAction = async (action: StatusActionConfig, extraData: Record<string, string>) => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onStatusChange(order.id, action.nextStatus, extraData);
      setSuccessMsg(`Estado actualizado a "${STATUS_UI_CONFIG[action.nextStatus].label}"`);
      setActiveAction(null);
      // Clear success after 3s
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al actualizar el estado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = (extraData: Record<string, string>) => {
    if (activeAction) {
      performAction(activeAction, extraData);
    }
  };

  return (
    <div className="space-y-5">
      {/* Current Status Badge */}
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm`}>
            {(() => {
              const Icon = getIcon(config.icon);
              return <Icon className={`w-5 h-5 ${config.textColor}`} />;
            })()}
          </div>
          <div className="flex-1">
            <p className={`text-lg font-semibold ${config.textColor}`}>
              {config.label}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {config.description}
            </p>
          </div>
        </div>

        {/* Extra info for specific states */}
        {currentStatus === 'IN_TRANSIT' && (order.trackingNumber || order.courierName) && (
          <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800 flex items-center gap-4 text-sm">
            {order.courierName && (
              <span className="text-orange-700 dark:text-orange-300">
                <Truck className="w-3.5 h-3.5 inline mr-1" />
                {order.courierName}
              </span>
            )}
            {order.trackingNumber && (
              <span className="text-orange-700 dark:text-orange-300 font-mono">
                # {order.trackingNumber}
              </span>
            )}
          </div>
        )}

        {currentStatus === 'NOT_DELIVERED' && order.deliveryReason && (
          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            <strong>Motivo:</strong> {order.deliveryReason}
          </div>
        )}

        {currentStatus === 'CANCELLED' && order.cancellationReason && (
          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">
            <strong>Motivo:</strong> {order.cancellationReason}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-semibold text-purple-700 dark:text-gray-300 uppercase tracking-wider mb-3">
          Seguimiento
        </h4>
        <StatusTimeline order={order} />
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-purple-700 dark:text-gray-300 uppercase tracking-wider mb-3">
            Acciones Disponibles
          </h4>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const variant = VARIANT_STYLES[action.variant] || VARIANT_STYLES.primary;
              const Icon = getIcon(action.icon);

              return (
                <button
                  key={action.action}
                  onClick={() => handleActionClick(action)}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variant.bg} ${variant.hover} ${variant.text}`}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Success / Error messages */}
      {successMsg && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Confirmation Dialog */}
      {activeAction && (
        <ConfirmDialog
          action={activeAction}
          order={order}
          onConfirm={handleConfirm}
          onCancel={() => setActiveAction(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
