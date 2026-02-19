'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { CheckCircle, Search, Filter, Calendar, Eye, Download, FileText, FileSpreadsheet, X } from 'lucide-react';
import { useRealtimeStore, Order } from '@/store/realtimeStore';
import { useCMSWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState, useMemo } from 'react';
import { OrderModal } from '@/components/cms/OrderModal';
import { exportOrderToCSV, exportOrderToPDF, exportOrdersToCSV } from '@/utils/exportOrders';
import { subDays, subMonths, subYears, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatPrice } from '@/utils/format';

type DateRange = '1d' | '7d' | '21d' | '1m' | '3m' | '6m' | '9m' | '1y' | 'custom';

function PedidosRealizadosPage() {
  const { orders, fetchOrders, updateOrderStatus, updateOrder } = useRealtimeStore();
  const ws = useCMSWebSocket();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Derivar selectedOrder del store para mantener sincronización automática
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('1m');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Obtener rango de fechas según selección
  const getDateRangeFilter = () => {
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = now;

    switch (dateRange) {
      case '1d':
        from = subDays(now, 1);
        break;
      case '7d':
        from = subDays(now, 7);
        break;
      case '21d':
        from = subDays(now, 21);
        break;
      case '1m':
        from = subMonths(now, 1);
        break;
      case '3m':
        from = subMonths(now, 3);
        break;
      case '6m':
        from = subMonths(now, 6);
        break;
      case '9m':
        from = subMonths(now, 9);
        break;
      case '1y':
        from = subYears(now, 1);
        break;
      case 'custom':
        if (customDateFrom) from = new Date(customDateFrom);
        if (customDateTo) to = new Date(customDateTo);
        break;
    }

    return { from, to };
  };

  // Fetch inicial de pedidos realizados
  useEffect(() => {
    const { from, to } = getDateRangeFilter();
    fetchOrders({
      status: ['DELIVERED', 'NOT_DELIVERED', 'PAYMENT_APPROVED', 'PREPARING', 'READY_FOR_SHIPPING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
      from: from?.toISOString(),
      to: to?.toISOString(),
    });
  }, [dateRange, customDateFrom, customDateTo]);

  // Suscribirse a eventos WebSocket
  useEffect(() => {
    if (!ws.isConnected()) return;

    const unsubOrderUpdated = ws.subscribe('order.updated', (data: any) => {
      updateOrder(data.order);
    });

    const unsubOrderStatusChanged = ws.subscribe('order.status.changed', (data: any) => {
      const { from, to } = getDateRangeFilter();
      fetchOrders({
        status: ['DELIVERED', 'NOT_DELIVERED', 'PAYMENT_APPROVED', 'PREPARING', 'READY_FOR_SHIPPING', 'READY_FOR_PICKUP', 'IN_TRANSIT', 'CANCELLED'],
        from: from?.toISOString(),
        to: to?.toISOString(),
      });
    });

    return () => {
      unsubOrderUpdated();
      unsubOrderStatusChanged();
    };
  }, [ws, updateOrder, fetchOrders, dateRange, customDateFrom, customDateTo]);

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filtro de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.numeroOrden.toLowerCase().includes(searchLower) ||
          order.usuario.nombre.toLowerCase().includes(searchLower) ||
          order.usuario.apellido.toLowerCase().includes(searchLower) ||
          order.usuario.email.toLowerCase().includes(searchLower) ||
          order.id.toLowerCase().includes(searchLower) ||
          order.items.some((item) => item.productId.toLowerCase().includes(searchLower))
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.cmsStatus === statusFilter);
    }

    // Filtro de método de pago
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter((order) => {
        const paymentInfo = order.gatewayPayments?.[0] || order.payment;
        const paymentMethod = (paymentInfo as any)?.metadata?.payment_method_id || '';
        return paymentMethod.includes(paymentMethodFilter);
      });
    }

    return filtered;
  }, [orders, searchTerm, statusFilter, paymentMethodFilter]);

  const deliveredOrders = filteredOrders.filter((o) => o.cmsStatus === 'DELIVERED');
  const notDeliveredOrders = filteredOrders.filter((o) => o.cmsStatus === 'NOT_DELIVERED');
  const inProcessOrders = filteredOrders.filter((o) => 
    ['PAYMENT_APPROVED', 'PREPARING', 'READY_FOR_SHIPPING', 'READY_FOR_PICKUP', 'IN_TRANSIT'].includes(o.cmsStatus)
  );
  const cancelledOrders = filteredOrders.filter((o) => o.cmsStatus === 'CANCELLED');

  const handleOpenModal = (order: Order) => {
    setSelectedOrderId(order.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: string,
    extraData?: {
      deliveryReason?: string;
      cancellationReason?: string;
      trackingNumber?: string;
      courierName?: string;
      notes?: string;
    }
  ) => {
    await updateOrderStatus(orderId, newStatus, {
      deliveryReason: extraData?.deliveryReason,
      cancellationReason: extraData?.cancellationReason,
      trackingNumber: extraData?.trackingNumber,
      courierName: extraData?.courierName,
      notes: extraData?.notes,
    });
  };

  const handleExportAllCSV = () => {
    exportOrdersToCSV(filteredOrders, `pedidos_realizados_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-700 dark:text-white flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              Pedidos Realizados
            </h1>
            <p className="text-purple-600 dark:text-white mt-1">
              Pedidos completados y entregados a clientes
            </p>
            {ws.isConnected() && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  Sincronizando en tiempo real
                </span>
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportAllCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar Todo (CSV)
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-purple-700 dark:text-white text-sm">Entregados</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700 dark:text-white">{deliveredOrders.length}</p>
            <p className="text-sm text-purple-600 dark:text-gray-400 mt-1">pedidos completados</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-purple-700 dark:text-white text-sm">No Entregados</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700 dark:text-white">{notDeliveredOrders.length}</p>
            <p className="text-sm text-purple-600 dark:text-gray-400 mt-1">con problemas</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="font-semibold text-purple-700 dark:text-white text-sm">En Proceso</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700 dark:text-white">{inProcessOrders.length}</p>
            <p className="text-sm text-purple-600 dark:text-gray-400 mt-1">en preparación/envío</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-purple-700 dark:text-white text-sm">Tasa Éxito</h3>
            </div>
            <p className="text-3xl font-bold text-purple-700 dark:text-white">
              {filteredOrders.length > 0
                ? Math.round((deliveredOrders.length / filteredOrders.length) * 100)
                : 0}
              %
            </p>
            <p className="text-sm text-purple-600 dark:text-gray-400 mt-1">de entregas exitosas</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-700 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} filtros avanzados
            </button>
          </div>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por #pedido, cliente, email, product ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { value: '1d', label: '1 día' },
                { value: '7d', label: '7 días' },
                { value: '21d', label: '21 días' },
                { value: '1m', label: '1 mes' },
                { value: '3m', label: '3 meses' },
                { value: '6m', label: '6 meses' },
                { value: '9m', label: '9 meses' },
                { value: '1y', label: '1 año' },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value as DateRange)}
                  className={cn(
                    'px-3 py-2 text-sm rounded-lg border transition-colors',
                    dateRange === range.value
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-gray-600'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-white mb-2">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Todos</option>
                    <option value="DELIVERED">Entregados</option>
                    <option value="NOT_DELIVERED">No Entregados</option>
                    <option value="PAYMENT_APPROVED">Pago Aprobado</option>
                    <option value="PREPARING">En Preparación</option>
                    <option value="READY_FOR_SHIPPING">Listo para Envío</option>
                    <option value="READY_FOR_PICKUP">Listo para Retiro</option>
                    <option value="IN_TRANSIT">En Camino</option>
                    <option value="CANCELLED">Cancelados</option>
                  </select>
                </div>

                {/* Payment Method Filter */}
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-white mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Todos</option>
                    <option value="credit">Tarjeta de Crédito</option>
                    <option value="debit">Tarjeta de Débito</option>
                    <option value="transfer">Transferencia</option>
                    <option value="cash">Efectivo</option>
                  </select>
                </div>

                {/* Custom Date Range */}
                <div>
                  <label className="block text-sm font-medium text-purple-700 dark:text-white mb-2">
                    Rango Personalizado
                  </label>
                  <button
                    onClick={() => setDateRange('custom')}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg border transition-colors',
                      dateRange === 'custom'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-gray-600'
                    )}
                  >
                    Seleccionar fechas
                  </button>
                </div>

                {/* Custom Date Inputs */}
                {dateRange === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-white mb-2">
                        Desde
                      </label>
                      <input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 dark:text-white mb-2">
                        Hasta
                      </label>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-purple-700 dark:text-white">
                Lista de Pedidos ({filteredOrders.length})
              </h2>
            </div>
            
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-purple-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-700 dark:text-white mb-2">
                  No hay pedidos registrados
                </h3>
                <p className="text-purple-600 dark:text-gray-400">
                  Los pedidos aparecerán aquí cuando se procesen
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-purple-700 dark:text-white">
                          Pedido #{order.numeroOrden}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            order.cmsStatus
                          )}`}
                        >
                          {getStatusLabel(order.cmsStatus)}
                        </span>
                      </div>
                      <p className="text-sm text-purple-600 dark:text-gray-400 mt-1">
                        {order.usuario.nombre} {order.usuario.apellido} • {formatPrice(order.total)} •{' '}
                        {(() => {
                          try {
                            const date = new Date(order.fecha);
                            return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString('es-ES');
                          } catch {
                            return 'Fecha inválida';
                          }
                        })()}
                      </p>
                      {order.deliveryReason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Motivo: {order.deliveryReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Export Buttons */}
                      <button
                        onClick={() => exportOrderToCSV(order)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Exportar CSV"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportOrderToPDF(order)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Exportar PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(order)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </CMSLayout>
  );
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'NOT_DELIVERED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'PAYMENT_APPROVED':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    case 'PREPARING':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'READY_FOR_SHIPPING':
    case 'READY_FOR_PICKUP':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'IN_TRANSIT':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    case 'PAYMENT_REJECTED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return 'Entregado';
    case 'NOT_DELIVERED':
      return 'No Entregado';
    case 'PAYMENT_APPROVED':
      return 'Pago Aprobado';
    case 'PREPARING':
      return 'En Preparación';
    case 'READY_FOR_SHIPPING':
      return 'Listo para Envío';
    case 'READY_FOR_PICKUP':
      return 'Listo para Retiro';
    case 'IN_TRANSIT':
      return 'En Camino';
    case 'CANCELLED':
      return 'Cancelado';
    case 'PAYMENT_REJECTED':
      return 'Pago Rechazado';
    case 'PENDING':
      return 'Pendiente';
    default:
      return status;
  }
}

export default withCMSProtection(PedidosRealizadosPage);
