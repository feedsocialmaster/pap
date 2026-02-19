'use client';

import { useState } from 'react';
import { Order } from '@/store/realtimeStore';
import { X, CheckCircle, XCircle, Package, DollarSign, CreditCard, Calendar, User, Mail, Phone, Truck, MapPin } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface PendingOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (orderId: string, notes?: string) => Promise<void>;
  onReject: (orderId: string, reason: string, notes?: string) => Promise<void>;
}

export function PendingOrderModal({ order, isOpen, onClose, onApprove, onReject }: PendingOrderModalProps) {
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug: ver qué datos llegan al modal
  console.log('📋 [PendingOrderModal] Datos de la orden:', {
    id: order.id,
    numeroOrden: order.numeroOrden,
    fecha: order.fecha,
    createdAt: (order as any).createdAt,
    total: order.total,
    items: order.items?.length,
    itemsConPromo: order.items?.filter(i => i.promocionNombre)?.length,
    keys: Object.keys(order)
  });

  const handleApprove = async () => {
    if (!showConfirmApprove) {
      setShowConfirmApprove(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onApprove(order.id, notes.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Debe especificar el motivo del rechazo');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onReject(order.id, rejectReason.trim(), notes.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar el pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const totalAmount = order.total;
  const paymentInfo = order.gatewayPayments?.[0] || order.payment;
  
  // DEBUG: Log para verificar datos de cuotas
  console.log('🔍 [PendingOrderModal] Datos de pago:', {
    orderId: order.id,
    orderInstallments: order.installments,
    paymentMethodDetail: order.paymentMethodDetail,
    paymentMetadata: paymentInfo?.metadata,
  });
  
  // Determinar método de pago y cuotas
  // Prioridad: 1) installments de la orden, 2) metadata del gateway, 3) default 1
  const paymentMethod = paymentInfo?.metadata?.payment_method_id || order.paymentMethodDetail || 'desconocido';
  const installments = order.installments || paymentInfo?.metadata?.installments || 1;
  const isCreditCard = paymentMethod.includes('credit') || paymentMethod.includes('tarjeta') || order.paymentMethodDetail === 'tarjeta';
  
  // Determinar tipo de entrega
  const fulfillmentType = order.fulfillmentType || 'shipping';
  const isPickup = fulfillmentType === 'pickup';

  // Obtener fecha con fallback a createdAt (para compatibilidad con websocket legacy)
  const orderDate = order.fecha || (order as any).createdAt;

  // Formatear fecha de manera segura
  const formatSafeDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return 'Fecha inválida';
      return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto resize">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-purple-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6" />
              Pedido #{order.numeroOrden}
            </h2>
            <p className="text-sm text-purple-100 mt-1">
              Estado: <span className="font-semibold">PENDIENTE</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Cliente
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <p className="text-purple-700 dark:text-white font-medium">
                  {order.usuario.nombre} {order.usuario.apellido}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                <p className="text-sm text-purple-600 dark:text-gray-400">{order.usuario.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-600" />
                <p className="text-sm text-purple-600 dark:text-gray-400">
                  Teléfono Celular: {order.usuario.telefono || 'No registrado'}
                </p>
              </div>
              <div className="text-xs text-purple-500 dark:text-gray-500">ID: {order.usuario.id}</div>
            </div>
          </div>

          {/* Order Info */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Información del Pedido
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-purple-600 dark:text-gray-400">Fecha:</span>
                <span className="text-sm font-medium text-purple-700 dark:text-white">
                  {formatSafeDate(orderDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-purple-600 dark:text-gray-400">ID Pedido:</span>
                <span className="text-xs font-mono text-purple-700 dark:text-white">{order.id}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Productos ({order.items.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-purple-700 dark:text-white font-medium">{item.product.nombre}</p>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-purple-600 dark:text-gray-400">
                        Talle: <span className="font-semibold">{item.talle}</span>
                        {item.color && (
                          <>
                            {' • '}
                            Color: <span className="font-semibold">{item.color}</span>
                          </>
                        )}
                        {' • '}
                        Cantidad: <span className="font-semibold">{item.cantidad}</span>
                      </p>
                      <p className="text-xs text-purple-500 dark:text-gray-500">ID: {item.productId}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {item.descuentoMonto && item.precioOriginal ? (
                      <>
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice(item.precioOriginal * item.cantidad)}
                        </p>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          {formatPrice(item.precioUnitario * item.cantidad)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          -{formatPrice(item.descuentoMonto * item.cantidad)}
                        </p>
                      </>
                    ) : (
                      <p className="text-purple-700 dark:text-white font-bold">
                        {formatPrice(item.precioUnitario * item.cantidad)}
                      </p>
                    )}
                    <p className="text-xs text-purple-600 dark:text-gray-400">
                      {formatPrice(item.precioUnitario)} c/u
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Promociones Aplicadas */}
          {order.items.some(item => item.promocionNombre) && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                <span className="text-lg">🏷️</span>
                Descuentos por Promociones
              </h4>
              <div className="space-y-2">
                {order.items
                  .filter(item => item.promocionNombre)
                  .map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-green-700 dark:text-green-400 font-medium">
                          {item.promocionNombre}
                        </span>
                        <span className="text-green-600 dark:text-green-500 ml-2">
                          en {item.product.nombre}
                        </span>
                      </div>
                      <span className="text-green-700 dark:text-green-400 font-semibold">
                        -{formatPrice((item.descuentoMonto || 0) * item.cantidad)}
                      </span>
                    </div>
                  ))}
                <div className="border-t border-green-200 dark:border-green-700 pt-2 mt-2 flex justify-between text-sm font-semibold">
                  <span className="text-green-700 dark:text-green-400">Total promociones</span>
                  <span className="text-green-700 dark:text-green-400">
                    -{formatPrice(
                      order.items.reduce((acc, item) => 
                        acc + ((item.descuentoMonto || 0) * item.cantidad), 0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Resumen de Totales */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumen de Totales
            </h4>
            <div className="space-y-2">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-700 dark:text-blue-400">Subtotal</span>
                <span className="text-blue-700 dark:text-blue-400 font-semibold">
                  {formatPrice(order.subtotal || totalAmount)}
                </span>
              </div>
              
              {/* Descuento de cupón (si existe) */}
              {order.subtotal && order.subtotal > totalAmount && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-700 dark:text-green-400">Descuento de cupón</span>
                  <span className="text-green-700 dark:text-green-400 font-semibold">
                    -{formatPrice(order.subtotal - totalAmount)}
                  </span>
                </div>
              )}
              
              {/* Total */}
              <div className="border-t border-blue-200 dark:border-blue-700 pt-2 flex justify-between items-center">
                <span className="text-blue-800 dark:text-blue-300 font-bold">Total</span>
                <span className="text-blue-800 dark:text-blue-300 font-bold text-lg">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-cyan-600" />
                <h4 className="font-semibold text-purple-700 dark:text-white">Total a Pagar</h4>
              </div>
              <p className="text-3xl font-bold text-purple-700 dark:text-white">
                {formatPrice(totalAmount)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-700 dark:text-white">Método de Pago</h4>
              </div>
              <p className="text-purple-700 dark:text-white font-medium capitalize">
                {isCreditCard ? 'Tarjeta de Crédito' : paymentMethod === 'transferencia' ? 'Transferencia' : paymentMethod === 'efectivo' ? 'Efectivo' : 'Mercado Pago'}
              </p>
              {isCreditCard && (
                <p className="text-sm text-purple-600 dark:text-gray-400 mt-1">
                  {installments === 1 ? '1 pago sin interés' : `${installments} cuotas sin interés`}
                </p>
              )}
            </div>
          </div>
          
          {/* Delivery/Pickup Info */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-3 flex items-center gap-2">
              {isPickup ? <MapPin className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
              {isPickup ? 'Retiro en Local' : 'Dirección de Envío'}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              {isPickup ? (
                <div>
                  <p className="text-purple-700 dark:text-white font-medium mb-3">
                    📍 El cliente retirará en local
                  </p>
                  {order.pickupLocationId && SUCURSALES[order.pickupLocationId as keyof typeof SUCURSALES] ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800 dark:text-green-400 font-bold mb-1">
                        ✓ Sucursal seleccionada por el cliente:
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 font-semibold">
                        {SUCURSALES[order.pickupLocationId as keyof typeof SUCURSALES].nombre}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {SUCURSALES[order.pickupLocationId as keyof typeof SUCURSALES].direccion}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-purple-500 dark:text-gray-500 mb-3">
                      (Sucursal no especificada)
                    </div>
                  )}
                  <div className="border-t border-purple-200 dark:border-gray-600 pt-3 mb-3">
                    <p className="text-xs text-purple-600 dark:text-gray-400 font-semibold mb-1">
                      📍 Todas nuestras sucursales:
                    </p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-purple-600 dark:text-gray-400 font-semibold">
                          Sucursal Central
                        </p>
                        <p className="text-xs text-purple-600 dark:text-gray-400">
                          Av. San Martín 1385, Ciudad de Mendoza, Mendoza, Argentina
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-purple-600 dark:text-gray-400 font-semibold">
                          Sucursal Secundaria
                        </p>
                        <p className="text-xs text-purple-600 dark:text-gray-400">
                          Av. Las Heras 300, Ciudad de Mendoza, Mendoza, Argentina
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-purple-200 dark:border-gray-600 pt-2 mb-2">
                    <p className="text-xs text-purple-600 dark:text-gray-400 font-semibold">
                      Horarios en ambas sucursales:
                    </p>
                    <p className="text-xs text-purple-600 dark:text-gray-400">
                      Lun - Vie: 09:30 - 21:00 hs<br />
                      Sábados: 09:00 - 21:00 hs
                    </p>
                  </div>
                  <p className="text-xs text-purple-500 dark:text-gray-500 mt-2">
                    💡 Enviar email cuando el pedido esté listo para retiro
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {order.direccionEnvio?.calle && (
                    <p className="text-purple-700 dark:text-white font-medium">
                      {order.direccionEnvio.calle}
                    </p>
                  )}
                  {(order.direccionEnvio?.ciudad || order.direccionEnvio?.provincia) && (
                    <p className="text-sm text-purple-600 dark:text-gray-400">
                      {order.direccionEnvio.ciudad}
                      {order.direccionEnvio.provincia && `, ${order.direccionEnvio.provincia}`}
                    </p>
                  )}
                  {order.direccionEnvio?.codigoPostal && (
                    <p className="text-sm text-purple-600 dark:text-gray-400">
                      CP: {order.direccionEnvio.codigoPostal}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Approve Confirmation */}
          {showConfirmApprove && !showRejectForm && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-green-700 dark:text-green-400">
                  ¿Confirmar aprobación del pedido?
                </p>
              </div>
              <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                El pedido será marcado como APROBADO y el cliente será notificado. Esta acción moverá el pedido a la pestaña "Realizados".
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmApprove(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar Aprobación'}
                </button>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold text-red-700 dark:text-red-400">Rechazar Pedido</h4>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-purple-700 dark:text-white mb-2">
                  Motivo del rechazo *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-700 text-purple-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  rows={3}
                  placeholder="Ej: Producto sin stock, datos de pago incorrectos, pedido duplicado..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {isProcessing ? 'Procesando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showConfirmApprove && !showRejectForm && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <XCircle className="w-5 h-5" />
                  Rechazar Compra
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Aprobar Compra
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 text-purple-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {showConfirmApprove || showRejectForm ? 'Cancelar' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
