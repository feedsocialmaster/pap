'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { PendingOrderModal } from '@/components/cms/PendingOrderModal';
import { useRealtimeStore, Order } from '@/store/realtimeStore';
import { useCMSWebSocket } from '@/hooks/useWebSocket';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  User,
  DollarSign,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { cn, formatPrice } from '@/utils/format';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper para formatear fechas de manera segura
function formatSafeDate(dateString: string | undefined | null): string {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      // Intentar parsear como ISO
      const isoDate = parseISO(dateString);
      if (isValid(isoDate)) {
        return format(isoDate, "d 'de' MMMM, yyyy", { locale: es });
      }
      return 'Fecha inválida';
    }
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  } catch (error) {
    console.error('Error al formatear fecha:', dateString, error);
    return 'Fecha inválida';
  }
}

function PedidosPendientesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusOrderId = searchParams?.get('focusOrder');

  const { orders, fetchOrders, loading, updateOrder, approveOrder, rejectOrder } = useRealtimeStore();
  const ws = useCMSWebSocket();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'cliente' | 'total'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);

  // Fetch inicial de pedidos pendientes
  useEffect(() => {
    fetchOrders({ status: ['PENDING'] });
  }, [fetchOrders]);

  // Suscribirse a eventos WebSocket
  useEffect(() => {
    if (!ws.isConnected()) return;

    const unsubOrderUpdated = ws.subscribe('order.updated', (data: any) => {
      console.log('Orden actualizada:', data);
      updateOrder(data.order);
    });

    const unsubOrderStatusChanged = ws.subscribe('order.status.changed', (data: any) => {
      console.log('Estado de orden cambiado:', data);
      fetchOrders({ status: ['PENDING'] });
    });

    return () => {
      unsubOrderUpdated();
      unsubOrderStatusChanged();
    };
  }, [ws, updateOrder, fetchOrders]);

  // Auto-scroll y resaltar pedido si viene de una notificación
  useEffect(() => {
    if (focusOrderId && orders.length > 0) {
      setSelectedOrder(focusOrderId);
      
      // Scroll al pedido
      setTimeout(() => {
        const element = document.getElementById(`order-${focusOrderId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Remover highlight después de 5 segundos
      setTimeout(() => {
        setSelectedOrder(null);
      }, 5000);
    }
  }, [focusOrderId, orders]);

  // Filtrar y ordenar pedidos
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.numeroOrden.toLowerCase().includes(searchLower) ||
        order.usuario.nombre.toLowerCase().includes(searchLower) ||
        order.usuario.apellido.toLowerCase().includes(searchLower) ||
        order.usuario.email.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower)
      );
    });

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'fecha':
          comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          break;
        case 'cliente':
          comparison = `${a.usuario.nombre} ${a.usuario.apellido}`.localeCompare(
            `${b.usuario.nombre} ${b.usuario.apellido}`
          );
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [orders, searchTerm, sortBy, sortOrder]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewOrder = (order: Order) => {
    setModalOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalOrder(null);
  };

  const handleApprove = async (orderId: string, notes?: string) => {
    await approveOrder(orderId, notes);
    handleCloseModal();
    // Refrescar la lista
    fetchOrders({ status: ['PENDING'] });
  };

  const handleReject = async (orderId: string, reason: string, notes?: string) => {
    await rejectOrder(orderId, reason, notes);
    handleCloseModal();
    // Refrescar la lista
    fetchOrders({ status: ['PENDING'] });
  };

  const handleRefresh = () => {
    fetchOrders({ status: ['PENDING'] });
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-700 dark:text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-yellow-600" />
              Pedidos Pendientes
            </h1>
            <p className="text-purple-600 dark:text-white mt-1">
              Gestiona los pedidos que están pendientes de procesamiento
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

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de pedido, cliente, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Ordenar */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSort('fecha')}
              className={cn(
                'px-4 py-2 rounded-lg border transition-colors flex items-center gap-2',
                sortBy === 'fecha'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <Calendar className="w-4 h-4" />
              Fecha
              {sortBy === 'fecha' &&
                (sortOrder === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                ))}
            </button>

            <button
              onClick={() => handleSort('cliente')}
              className={cn(
                'px-4 py-2 rounded-lg border transition-colors flex items-center gap-2',
                sortBy === 'cliente'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <User className="w-4 h-4" />
              Cliente
              {sortBy === 'cliente' &&
                (sortOrder === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                ))}
            </button>

            <button
              onClick={() => handleSort('total')}
              className={cn(
                'px-4 py-2 rounded-lg border transition-colors flex items-center gap-2',
                sortBy === 'total'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <DollarSign className="w-4 h-4" />
              Total
              {sortBy === 'total' &&
                (sortOrder === 'asc' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                ))}
            </button>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {loading && filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Cargando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay pedidos pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  id={`order-${order.id}`}
                  className={cn(
                    'p-4 transition-all duration-300',
                    selectedOrder === order.id &&
                      'bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Pedido #{order.numeroOrden}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full">
                          PENDIENTE
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          {order.usuario.nombre} {order.usuario.apellido}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {formatSafeDate(order.fecha)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          {formatPrice(order.total)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewOrder(order)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
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

        {/* Footer con contador */}
        {filteredOrders.length > 0 && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}{' '}
            pendiente{filteredOrders.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOrder && (
        <PendingOrderModal
          order={modalOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </CMSLayout>
  );
}

export default withCMSProtection(PedidosPendientesPage);
