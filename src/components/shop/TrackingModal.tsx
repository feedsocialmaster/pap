'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Package, PackageCheck, Truck, CheckCircle, CheckCircle2,
  AlertCircle, MapPin, Clock, CreditCard, Ban, Loader2,
} from 'lucide-react';
import axios from '@/lib/axios';
import { formatDateTime } from '@/utils/format';

// ============================================================================
// CONSTANTS
// ============================================================================

// Definición de sucursales
const SUCURSALES = {
  SUCURSAL_CENTRAL: {
    nombre: 'Sucursal Central',
    direccion: 'Av. San Martín 1385, Ciudad de Mendoza, Mendoza, Argentina',
  },
  SUCURSAL_SECUNDARIA: {
    nombre: 'Sucursal Secundaria',
    direccion: 'Av. Las Heras 300, Ciudad de Mendoza, Mendoza, Argentina',
  },
} as const;

// ============================================================================
// TYPES
// ============================================================================

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onConfirmarRecepcion?: () => void;
}

type CMSStatus =
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

interface OrderTracking {
  id: string;
  numeroOrden: string;
  fecha: string;
  // Legacy fields
  estadoEntrega: 'PREPARANDO' | 'EN_CAMINO' | 'ENTREGADO' | 'VISITADO_NO_ENTREGADO' | 'RETIRO_EN_LOCAL' | 'CANCELADO';
  intentosEntrega: number;
  motivoNoEntrega: string | null;
  fechaUltimoIntento: string | null;
  confirmoRecepcion: boolean;
  fechaConfirmacion: string | null;
  // New CMS fields
  cmsStatus: CMSStatus;
  fulfillmentType?: string | null;
  pickupLocationId?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  shippingNotes?: string | null;
  paymentApprovedAt?: string | null;
  preparingStartedAt?: string | null;
  readyForShippingAt?: string | null;
  readyForPickupAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancellationReason?: string | null;
  deliveryReason?: string | null;
  historialEstados: Array<{
    id: string;
    estadoAnterior: string | null;
    estadoNuevo: string;
    notas: string | null;
    createdAt: string;
  }>;
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

interface StepConfig {
  status: CMSStatus;
  title: string;
  description: string;
  icon: React.ElementType;
}

const SHIPPING_STEPS: StepConfig[] = [
  {
    status: 'PENDING',
    title: 'Pedido Recibido',
    description: 'Recibimos tu pedido y estamos verificando el pago.',
    icon: CreditCard,
  },
  {
    status: 'PAYMENT_APPROVED',
    title: 'Pago Confirmado',
    description: 'Tu pago fue aprobado exitosamente.',
    icon: CheckCircle,
  },
  {
    status: 'PREPARING',
    title: 'Preparando tu Pedido',
    description: 'Estamos preparando tus productos con mucho cuidado.',
    icon: Package,
  },
  {
    status: 'READY_FOR_SHIPPING',
    title: 'Listo para Envío',
    description: 'Tu pedido está empaquetado y listo para despachar.',
    icon: PackageCheck,
  },
  {
    status: 'IN_TRANSIT',
    title: 'En Camino',
    description: 'Tu pedido ya salió y está en camino hacia vos.',
    icon: Truck,
  },
  {
    status: 'DELIVERED',
    title: 'Entregado',
    description: '¡Tu pedido fue entregado! Que disfrutes tu compra.',
    icon: CheckCircle2,
  },
];

const PICKUP_STEPS: StepConfig[] = [
  {
    status: 'PENDING',
    title: 'Pedido Recibido',
    description: 'Recibimos tu pedido y estamos verificando el pago.',
    icon: CreditCard,
  },
  {
    status: 'PAYMENT_APPROVED',
    title: 'Pago Confirmado',
    description: 'Tu pago fue aprobado exitosamente.',
    icon: CheckCircle,
  },
  {
    status: 'PREPARING',
    title: 'Preparando tu Pedido',
    description: 'Estamos preparando tus productos con mucho cuidado.',
    icon: Package,
  },
  {
    status: 'READY_FOR_PICKUP',
    title: 'Listo para Retiro',
    description: 'Tu pedido está listo. Puedes retirarlo en nuestra tienda.',
    icon: MapPin,
  },
  {
    status: 'DELIVERED',
    title: 'Retirado',
    description: '¡Retiraste tu pedido! Que disfrutes tu compra.',
    icon: CheckCircle2,
  },
];

const STATUS_ORDER: CMSStatus[] = [
  'PENDING',
  'PAYMENT_APPROVED',
  'PREPARING',
  'READY_FOR_SHIPPING',
  'READY_FOR_PICKUP',
  'IN_TRANSIT',
  'DELIVERED',
];

function getStepsForOrder(tracking: OrderTracking): StepConfig[] {
  return tracking.fulfillmentType === 'pickup' ? PICKUP_STEPS : SHIPPING_STEPS;
}

function getStepIndex(steps: StepConfig[], status: CMSStatus): number {
  return steps.findIndex((s) => s.status === status);
}

function getTimestampForStep(tracking: OrderTracking, status: CMSStatus): string | null {
  const map: Record<string, string | null | undefined> = {
    PENDING: tracking.fecha,
    PAYMENT_APPROVED: tracking.paymentApprovedAt ?? null,
    PREPARING: tracking.preparingStartedAt ?? null,
    READY_FOR_SHIPPING: tracking.readyForShippingAt ?? null,
    READY_FOR_PICKUP: tracking.readyForPickupAt ?? null,
    IN_TRANSIT: tracking.shippedAt ?? null,
    DELIVERED: tracking.deliveredAt ?? null,
  };
  return map[status] ?? null;
}

function formatTs(ts: string | null): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TrackingModal({ isOpen, onClose, orderId, onConfirmarRecepcion }: TrackingModalProps) {
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchTracking();
    }
  }, [isOpen, orderId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/my/orders/${orderId}/tracking`);
      setTracking(response.data.data);
    } catch (error) {
      console.error('Error al cargar tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRecepcion = async () => {
    if (!tracking || confirmando) return;

    if (tracking.intentosEntrega >= 2 && tracking.cmsStatus === 'NOT_DELIVERED') {
      if (!window.confirm('Has sido visitado 2 veces sin éxito. Al confirmar, tu pedido pasará a estar disponible para retiro en local. ¿Deseas continuar?')) {
        return;
      }
    }

    try {
      setConfirmando(true);
      await axios.post(`/my/orders/${orderId}/confirmar-recepcion`);
      alert('¡Recepción confirmada exitosamente!');
      fetchTracking();
      if (onConfirmarRecepcion) {
        onConfirmarRecepcion();
      }
    } catch (error: any) {
      console.error('Error al confirmar recepción:', error);
      alert(error.response?.data?.error || 'Error al confirmar recepción');
    } finally {
      setConfirmando(false);
    }
  };

  if (!isOpen) return null;

  const isTerminal = tracking && ['PAYMENT_REJECTED', 'CANCELLED'].includes(tracking.cmsStatus);
  const isNotDelivered = tracking?.cmsStatus === 'NOT_DELIVERED';
  const isDelivered = tracking?.cmsStatus === 'DELIVERED';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-dark">Estado de tu Pedido</h2>
            {tracking && <p className="text-gray">{tracking.numeroOrden}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-gray">Cargando información...</p>
            </div>
          ) : tracking ? (
            <div className="space-y-6">

              {/* ——— TIMELINE ——— */}
              {!isTerminal && !isNotDelivered && (
                <div className="relative">
                  {(() => {
                    const steps = getStepsForOrder(tracking);
                    const currentIdx = getStepIndex(steps, tracking.cmsStatus);

                    return steps.map((step, index) => {
                      const isCompleted = currentIdx > -1 && index < currentIdx;
                      const isCurrent = currentIdx === index;
                      const isPending = currentIdx > -1 ? index > currentIdx : true;
                      const Icon = step.icon;
                      const ts = getTimestampForStep(tracking, step.status);

                      return (
                        <div key={step.status} className="relative flex gap-4 pb-8">
                          {/* Connector line */}
                          {index < steps.length - 1 && (
                            <div
                              className={`absolute left-5 top-12 w-0.5 h-full ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                              }`}
                            />
                          )}

                          {/* Icon circle */}
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <Icon size={20} />
                          </div>

                          {/* Content */}
                          <div className={`flex-1 pt-1 ${isPending ? 'opacity-40' : ''}`}>
                            <h3
                              className={`font-semibold ${
                                isCurrent
                                  ? 'text-purple-700'
                                  : isCompleted
                                  ? 'text-green-700'
                                  : 'text-gray-500'
                              }`}
                            >
                              {step.title}
                              {isCurrent && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  Actual
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray mt-1">{step.description}</p>
                            {(isCompleted || isCurrent) && ts && (
                              <p className="text-xs text-gray-400 mt-1">{formatTs(ts)}</p>
                            )}

                            {/* In-transit: courier info */}
                            {isCurrent && step.status === 'IN_TRANSIT' && (tracking.trackingNumber || tracking.courierName || tracking.shippingNotes) && (
                              <div className="mt-2 bg-orange-50 rounded-lg p-3 text-sm">
                                {tracking.courierName && (
                                  <p className="text-orange-700 font-medium">
                                    <Truck className="w-3.5 h-3.5 inline mr-1" />
                                    Courier: {tracking.courierName}
                                  </p>
                                )}
                                {tracking.trackingNumber && (
                                  <p className="text-orange-600 font-mono mt-1">
                                    Nro. seguimiento: {tracking.trackingNumber}
                                  </p>
                                )}
                                {tracking.shippingNotes && (
                                  <p className="text-orange-600 mt-2 italic">
                                    Notas: {tracking.shippingNotes}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Ready for pickup: address */}
                            {isCurrent && step.status === 'READY_FOR_PICKUP' && (
                              <div className="mt-2 bg-purple-50 rounded-lg p-3 text-sm">
                                <p className="text-purple-700 font-medium mb-2">
                                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                                  Retiralo en la sucursal seleccionada
                                </p>
                                {tracking.pickupLocationId && SUCURSALES[tracking.pickupLocationId as keyof typeof SUCURSALES] ? (
                                  <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                                    <p className="text-xs text-green-800 font-bold mb-1">
                                      ✓ Tu sucursal seleccionada:
                                    </p>
                                    <p className="text-xs text-green-700 font-semibold">
                                      {SUCURSALES[tracking.pickupLocationId as keyof typeof SUCURSALES].nombre}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      {SUCURSALES[tracking.pickupLocationId as keyof typeof SUCURSALES].direccion}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-purple-600 text-xs space-y-2 mb-2">
                                    <div>
                                      <p className="font-semibold">Sucursal Central</p>
                                      <p>Av. San Martín 1385, Ciudad de Mendoza, Mendoza</p>
                                    </div>
                                    <div>
                                      <p className="font-semibold">Sucursal Secundaria</p>
                                      <p>Av. Las Heras 300, Ciudad de Mendoza, Mendoza</p>
                                    </div>
                                  </div>
                                )}
                                <div className="border-t border-purple-200 pt-2">
                                  <p className="text-xs text-purple-600 font-semibold">Horarios en ambas sucursales:</p>
                                  <p className="text-xs text-purple-600">Lun - Vie: 09:30 - 21:00 hs</p>
                                  <p className="text-xs text-purple-600">Sábados: 09:00 - 21:00 hs</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {/* ——— PAYMENT REJECTED ——— */}
              {tracking.cmsStatus === 'PAYMENT_REJECTED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h3 className="font-semibold text-red-700 mb-1">Pago Rechazado</h3>
                      <p className="text-sm text-red-600">
                        Lamentablemente tu pago no pudo ser procesado. Si crees que se trata de un error, por favor contactanos.
                      </p>
                      {tracking.deliveryReason && (
                        <p className="text-sm text-red-500 mt-2">
                          <strong>Motivo:</strong> {tracking.deliveryReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ——— CANCELLED ——— */}
              {tracking.cmsStatus === 'CANCELLED' && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <Ban className="text-gray-500 flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1">Pedido Cancelado</h3>
                      <p className="text-sm text-gray-600">
                        Este pedido ha sido cancelado.
                      </p>
                      {tracking.cancellationReason && (
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Motivo:</strong> {tracking.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ——— NOT DELIVERED ——— */}
              {isNotDelivered && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-700 mb-1">
                        Problema en la Entrega (Intento {tracking.intentosEntrega} de 2)
                      </h3>
                      <p className="text-sm text-red-600 mb-2">
                        No pudimos entregarte tu pedido en el domicilio.
                      </p>
                      {(tracking.motivoNoEntrega || tracking.deliveryReason) && (
                        <p className="text-sm text-dark mb-2">
                          <strong>Motivo:</strong> {tracking.motivoNoEntrega || tracking.deliveryReason}
                        </p>
                      )}
                      {tracking.fechaUltimoIntento && (
                        <p className="text-sm text-gray mb-2">
                          <Clock size={14} className="inline mr-1" />
                          {formatDateTime(new Date(tracking.fechaUltimoIntento))}
                        </p>
                      )}
                      {tracking.intentosEntrega < 2 ? (
                        <p className="text-sm font-medium text-green-600">
                          Volveremos a intentar la entrega en las próximas 24 horas.
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-red-700">
                          Máximo de intentos alcanzado. Podrás retirarlo en nuestro local.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ——— CONFIRM DELIVERY BUTTON ——— */}
              {!tracking.confirmoRecepcion &&
               !isTerminal &&
               !isDelivered &&
               (tracking.cmsStatus === 'IN_TRANSIT' ||
                tracking.cmsStatus === 'READY_FOR_PICKUP' ||
                isNotDelivered) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray mb-3">
                    {tracking.intentosEntrega >= 2
                      ? '¿Ya recibiste tu producto o prefieres retirarlo en el local?'
                      : '¿Ya recibiste tu producto?'}
                  </p>
                  <button
                    onClick={handleConfirmarRecepcion}
                    disabled={confirmando}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmando ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Confirmar que Recibí mi Producto
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ——— DELIVERY CONFIRMED ——— */}
              {(tracking.confirmoRecepcion || isDelivered) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
                    <div>
                      <h3 className="font-semibold text-green-700 mb-1">
                        {tracking.confirmoRecepcion ? '¡Pedido Confirmado!' : '¡Pedido Entregado!'}
                      </h3>
                      {tracking.confirmoRecepcion && tracking.fechaConfirmacion && (
                        <p className="text-sm text-gray">
                          Confirmaste la recepción el {formatDateTime(new Date(tracking.fechaConfirmacion))}
                        </p>
                      )}
                      {!tracking.confirmoRecepcion && tracking.deliveredAt && (
                        <p className="text-sm text-gray">
                          Entregado el {formatTs(tracking.deliveredAt)}
                        </p>
                      )}
                      <p className="text-sm text-green-600 mt-2">
                        ¡Gracias por tu compra! Esperamos que disfrutes tus nuevos zapatos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ——— CHANGE HISTORY ——— */}
              {tracking.historialEstados.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-dark mb-4">Historial de Cambios</h3>
                  <div className="space-y-3">
                    {tracking.historialEstados.map((cambio) => (
                      <div key={cambio.id} className="text-sm bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-dark">
                            {cambio.estadoAnterior ? `${cambio.estadoAnterior} → ` : ''}{cambio.estadoNuevo}
                          </span>
                          <span className="text-xs text-gray">
                            {formatDateTime(new Date(cambio.createdAt))}
                          </span>
                        </div>
                        {cambio.notas && (
                          <p className="text-gray mt-1">{cambio.notas}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-600">No se pudo cargar la información del pedido</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
