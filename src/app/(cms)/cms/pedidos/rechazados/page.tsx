'use client';

import { useEffect, useState, useMemo } from 'react';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { XCircle, Search, Filter, Calendar, AlertTriangle, Eye } from 'lucide-react';
import { useRealtimeStore, Order } from '@/store/realtimeStore';
import { formatPrice } from '@/utils/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OrderModal } from '@/components/cms/OrderModal';

function PedidosRechazadosPage() {
  const { orders, fetchOrders, loading } = useRealtimeStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filtrar pedidos rechazados
  const rejectedOrders = useMemo(() => {
    return orders.filter(order => 
      order.cmsStatus === 'PAYMENT_REJECTED' || 
      order.cmsStatus === 'CANCELLED' ||
      order.cmsStatus === 'INVENTORY_ERROR'
    );
  }, [orders]);

  // Aplicar filtros de búsqueda y razón  
  const filteredOrders = useMemo(() => {
    let filtered = rejectedOrders;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.numeroOrden.toLowerCase().includes(searchLower) ||
        order.usuario.nombre.toLowerCase ().includes(searchLower) ||
        order.usuario.apellido.toLowerCase().includes(searchLower) ||
        order.usuario.email.toLowerCase().includes(searchLower)
      );
    }

    if (reasonFilter !== 'all') {
      filtered = filtered.filter(order => {
        if (reasonFilter === 'payment') return order.cmsStatus === 'PAYMENT_REJECTED';
        if (reasonFilter === 'inventory') return order.cmsStatus === 'INVENTORY_ERROR';
        if (reasonFilter === 'cancelled') return order.cmsStatus === 'CANCELLED';
        return true;
      });
    }

    return filtered;
  }, [rejectedOrders, searchTerm, reasonFilter]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = rejectedOrders.length;
    const paymentRejected = rejectedOrders.filter(o => o.cmsStatus === 'PAYMENT_REJECTED').length;
    const inventoryError = rejectedOrders.filter(o => o.cmsStatus === 'INVENTORY_ERROR').length;
    const cancelled = rejectedOrders.filter(o => o.cmsStatus === 'CANCELLED').length;
    
    return { total, paymentRejected, inventoryError, cancelled };
  }, [rejectedOrders]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const getRejectionReason = (order: Order): string => {
    if (order.cmsStatus === 'PAYMENT_REJECTED') return 'Pago rechazado';
    if (order.cmsStatus === 'INVENTORY_ERROR') return 'Stock insuficiente';
    if (order.cmsStatus === 'CANCELLED') return 'Cancelado';
    return order.cancellationReason || 'No especificado';
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'PAYMENT_REJECTED': return 'bg-red-100 text-red-700';
      case 'INVENTORY_ERROR': return 'bg-orange-100 text-orange-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              Pedidos Rechazados
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Pedidos cancelados o rechazados por diferentes motivos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Total Rechazados</h3>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">pedidos cancelados</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Stock Insuficiente</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.inventoryError}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">por falta de stock</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Cancelados</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">cancelados por cliente</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Pago Rechazado</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.paymentRejected}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">problemas de pago</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por #pedido o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select 
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todos los motivos</option>
              <option value="inventory">Stock insuficiente</option>
              <option value="cancelled">Cancelado por cliente</option>
              <option value="payment">Pago rechazado</option>
            </select>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Filter className="w-5 h-5" />
              Filtrar
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 p-6">
              <XCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No hay pedidos rechazados
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || reasonFilter !== 'all' 
                  ? 'No se encontraron pedidos con los filtros actuales'
                  : 'Todos los pedidos están siendo procesados correctamente'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                          #{order.numeroOrden}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {order.usuario.nombre} {order.usuario.apellido}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.usuario.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(order.fecha), 'dd MMM yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.cmsStatus)}`}>
                          {getRejectionReason(order)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
          onUpdateStatus={async () => {}}
        />
      )}
    </CMSLayout>
  );
}

export default withCMSProtection(PedidosRechazadosPage);
