'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Eye, Download, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { withClientAuth } from '@/components/auth/withClientAuth';
import { formatPrice, formatDateTime } from '@/utils/format';
import axios from '@/lib/axios';
import { serverBaseUrl } from '@/lib/api';
import TrackingModal from '@/components/shop/TrackingModal';

interface OrderItem {
  id: string;
  productId: string;
  cantidad: number;
  talle: number;
  color: string | null;
  precioUnitario: number;
  product: {
    id: string;
    nombre: string;
    imagenes: Array<{ url: string; alt: string | null }>;
  };
}

interface Order {
  id: string;
  numeroOrden: string;
  fecha: string;
  subtotal: number;
  descuentoPuntos: number;
  total: number;
  estado: 'EN_PROCESO' | 'ENTREGADO' | 'CANCELADO';
  estadoEntrega: 'PREPARANDO' | 'EN_CAMINO' | 'ENTREGADO' | 'VISITADO_NO_ENTREGADO' | 'RETIRO_EN_LOCAL' | 'CANCELADO';
  puntosGanados: number;
  intentosEntrega: number;
  confirmoRecepcion: boolean;
  facturaUrl?: string | null; // URL del PDF de factura
  items: OrderItem[];
}

export default withClientAuth(function MisComprasPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, user, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/my/orders');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerTracking = (orderId: string) => {
    setSelectedOrderId(orderId);
    setTrackingModalOpen(true);
  };

  const getEstadoColor = (estado: Order['estado']) => {
    switch (estado) {
      case 'ENTREGADO':
        return 'bg-success/20 text-success';
      case 'EN_PROCESO':
        return 'bg-warning/20 text-warning';
      case 'CANCELADO':
        return 'bg-error/20 text-error';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getEstadoEntregaColor = (estadoEntrega: Order['estadoEntrega']) => {
    switch (estadoEntrega) {
      case 'ENTREGADO':
        return 'bg-success/20 text-success';
      case 'EN_CAMINO':
        return 'bg-primary/20 text-primary';
      case 'PREPARANDO':
      case 'RETIRO_EN_LOCAL':
        return 'bg-warning/20 text-warning';
      case 'CANCELADO':
      case 'VISITADO_NO_ENTREGADO':
        return 'bg-error/20 text-error';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getEstadoEntregaTexto = (estadoEntrega: Order['estadoEntrega']) => {
    switch (estadoEntrega) {
      case 'PREPARANDO':
        return 'Preparando tu pedido';
      case 'EN_CAMINO':
        return 'En camino';
      case 'ENTREGADO':
        return 'Producto entregado';
      case 'VISITADO_NO_ENTREGADO':
        return 'Visitado - No entregado';
      case 'RETIRO_EN_LOCAL':
        return 'Retiro en local';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return estadoEntrega;
    }
  };

  const getEstadoEntregaIcon = (estadoEntrega: Order['estadoEntrega']) => {
    switch (estadoEntrega) {
      case 'PREPARANDO':
        return <Package size={16} className="text-warning" />;
      case 'EN_CAMINO':
        return <Truck size={16} className="text-primary" />;
      case 'ENTREGADO':
        return <CheckCircle size={16} className="text-success" />;
      case 'CANCELADO':
        return <XCircle size={16} className="text-error" />;
      default:
        return <Package size={16} className="text-gray" />;
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container-custom pt-32 pb-8">
      {/* Header */}
      <div className="mb-8 mt-16">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag size={32} className="text-primary" />
          <h1 className="text-3xl font-bold text-dark">Mis Compras</h1>
        </div>
        <p className="text-gray">
          Revisa tu historial de compras y el estado de tus pedidos
        </p>
        <p className="text-gray text-sm mt-2">
          Para mantenerte al tanto de cómo seguir el envío en tiempo real de tu pedido o tus productos, te recomendamos que aprietes F5 en la computadora o que actualices la página en tu teléfono móvil.
        </p>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-4xl mx-auto">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-dark mb-6">Historial de Compras</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray">Cargando pedidos...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((orden) => {
                const primeraImagen = orden.items[0]?.product?.imagenes?.[0];
                const imagenUrl = primeraImagen?.url || '/placeholder-product.jpg';

                return (
                  <div key={orden.id} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-semibold text-dark">{orden.numeroOrden}</p>
                        <p className="text-sm text-gray">{formatDateTime(new Date(orden.fecha))}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoEntregaColor(orden.estadoEntrega)}`}>
                          {getEstadoEntregaTexto(orden.estadoEntrega)}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray">
                          {getEstadoEntregaIcon(orden.estadoEntrega)}
                          <span className="text-xs">{formatDateTime(new Date(orden.fecha))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {orden.items.map((item) => {
                        const img = item.product.imagenes?.[0];
                        const imgUrl = img?.url || '/placeholder-product.jpg';
                        
                        return (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                              <img src={imgUrl} alt={img?.alt || item.product.nombre} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-dark">{item.product.nombre}</p>
                              <div className="text-sm text-gray">
                                Cantidad: {item.cantidad} | Talle: {item.talle}
                                {item.color && ` | Color: ${item.color}`}
                              </div>
                              <p className="text-sm font-medium text-primary">{formatPrice(item.precioUnitario)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-lg font-bold text-dark">Total: {formatPrice(orden.total)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerTracking(orden.id)}
                          className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          <Eye size={16} />
                          Ver Estado
                        </button>
                        {/* Factura: disponible siempre que se haya subido desde el CMS */}
                        {orden.facturaUrl ? (
                          <a
                            href={`${serverBaseUrl}${orden.facturaUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Download size={16} />
                            Descargar Factura
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">Aún no has realizado ninguna compra</p>
              <button
                onClick={() => router.push('/tienda')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Ir a la tienda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Tracking */}
      {selectedOrderId && (
        <TrackingModal
          isOpen={trackingModalOpen}
          onClose={() => {
            setTrackingModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
          onConfirmarRecepcion={fetchOrders}
        />
      )}
    </div>
  );
});
