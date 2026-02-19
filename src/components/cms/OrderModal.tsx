'use client';

import { useState } from 'react';
import { Order, useRealtimeStore } from '@/store/realtimeStore';
import { getStatusColor, getStatusLabel } from '@/types/order-status';
import { OrderStatusManager } from './OrderStatusManager';
import { InvoiceUpload } from './InvoiceUpload';
import { X, Package, DollarSign, CreditCard, MapPin, Truck, Phone } from 'lucide-react';
import { formatPrice } from '@/utils/format';

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

interface OrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
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

export function OrderModal({ order, isOpen, onClose, onUpdateStatus }: OrderModalProps) {
  if (!isOpen) return null;

  const totalAmount = order.total;
  const paymentInfo = order.gatewayPayments?.[0] || order.payment;
  
  // DEBUG: Log para verificar datos de cuotas
  console.log('🔍 [OrderModal] Datos de pago:', {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-purple-700 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6" />
              Pedido #{order.numeroOrden}
            </h2>
            <p className="text-sm text-purple-600 dark:text-gray-400 mt-1">
              Estado: <span className={`font-semibold ${getStatusColor(order.cmsStatus)}`}>
                {getStatusLabel(order.cmsStatus)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-600 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-3">
              Información del Cliente
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <p className="text-purple-700 dark:text-white font-medium">
                {order.usuario.nombre} {order.usuario.apellido}
              </p>
              <p className="text-sm text-purple-600 dark:text-gray-400">{order.usuario.email}</p>
              <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-gray-400">
                <Phone className="w-4 h-4" />
                <span>Teléfono Celular: {order.usuario.telefono || 'No registrado'}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-3">
              Productos
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <p className="text-purple-700 dark:text-white font-medium">{item.product.nombre}</p>
                    <p className="text-sm text-purple-600 dark:text-gray-400">
                      Talle: {item.talle} {item.color && `• Color: ${item.color}`} • Cantidad: {item.cantidad}
                    </p>
                    <p className="text-xs text-purple-500 dark:text-gray-500">ID: {item.productId}</p>
                  </div>
                  <div className="text-right">
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
                      <p className="text-purple-700 dark:text-white font-semibold">
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

          {/* Información de Entrega */}
          <div>
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-3 flex items-center gap-2">
              {order.fulfillmentType === 'pickup' ? (
                <>
                  <MapPin className="w-5 h-5" />
                  Retiro en Local
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5" />
                  Dirección de Envío
                </>
              )}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              {order.fulfillmentType === 'pickup' ? (
                <div>
                  {order.pickupLocationId && SUCURSALES[order.pickupLocationId as keyof typeof SUCURSALES] ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                      <p className="text-sm text-green-800 dark:text-green-400 font-bold mb-2">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      🏪 Retiro en tienda (sucursal no especificada)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {order.direccionEnvio ? (
                    <>
                      <p className="text-purple-700 dark:text-white font-medium">
                        {order.direccionEnvio.calle}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-gray-400">
                        {order.direccionEnvio.ciudad}, {order.direccionEnvio.provincia}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-gray-400">
                        CP: {order.direccionEnvio.codigoPostal}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                      Dirección no especificada
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-cyan-600" />
                <h4 className="font-semibold text-purple-700 dark:text-white">Total</h4>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-white">
                {formatPrice(totalAmount)}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-700 dark:text-white">Método de Pago</h4>
              </div>
              <p className="text-purple-700 dark:text-white">
                {isCreditCard ? 'Tarjeta de Crédito' : paymentMethod === 'transferencia' ? 'Transferencia' : paymentMethod === 'efectivo' ? 'Efectivo' : 'Mercado Pago'}
              </p>
              {isCreditCard && (
                <p className="text-sm text-purple-600 dark:text-gray-400">
                  {installments === 1 ? '1 pago sin interés' : `${installments} cuotas sin interés`}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Upload - Solo visible cuando el pedido está ENTREGADO */}
          {order.cmsStatus === 'DELIVERED' && (
            <InvoiceUpload
              orderId={order.id}
              currentInvoiceUrl={order.facturaUrl}
              onInvoiceChange={(newUrl) => {
                // Actualizamos el estado local del store
                useRealtimeStore.getState().updateOrder({
                  ...order,
                  facturaUrl: newUrl,
                });
              }}
            />
          )}

          {/* Order Status Manager (Timeline + Actions) */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <OrderStatusManager
              order={order}
              onStatusChange={onUpdateStatus}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-purple-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
