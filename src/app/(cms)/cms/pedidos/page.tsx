'use client';

import { useState, useEffect } from 'react';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { Package, Eye, Edit, Save, X } from 'lucide-react';
import axios from '@/lib/axios';
import { formatPrice, formatDateTime } from '@/utils/format';

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

interface OrderItem {
  id: string;
  cantidad: number;
  talle: number;
  color: string | null;
  precioUnitario: number;
  product?: {
    nombre: string;
    imagenes: Array<{ url: string }>;
  };
}

interface Order {
  id: string;
  numeroOrden: string;
  fecha: string;
  total: number;
  estado: string;
  estadoEntrega: string;
  intentosEntrega: number;
  motivoNoEntrega: string | null;
  confirmoRecepcion: boolean;
  fulfillmentType?: 'shipping' | 'pickup';
  pickupLocationId?: string | null;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
  };
  items: OrderItem[];
  direccionEnvio: {
    calle: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
  };
}

const ESTADOS_ENTREGA = [
  { value: 'PREPARANDO', label: 'Preparando Pedido', color: 'bg-blue-100 text-blue-700' },
  { value: 'EN_CAMINO', label: 'En Camino', color: 'bg-purple-100 text-purple-700' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-green-100 text-green-700' },
  { value: 'VISITADO_NO_ENTREGADO', label: 'Visitado - No Entregado', color: 'bg-orange-100 text-orange-700' },
  { value: 'RETIRO_EN_LOCAL', label: 'Retiro en Local', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-700' },
];

function GestionPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    estadoEntrega: '',
    notas: '',
    motivoNoEntrega: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/orders');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingId(order.id);
    setEditForm({
      estadoEntrega: order.estadoEntrega,
      notas: '',
      motivoNoEntrega: order.motivoNoEntrega || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ estadoEntrega: '', notas: '', motivoNoEntrega: '' });
  };

  const handleSave = async (orderId: string) => {
    try {
      setSaving(true);
      await axios.put(`/cms/orders/${orderId}/estado-entrega`, {
        estadoEntrega: editForm.estadoEntrega,
        notas: editForm.notas || undefined,
        motivoNoEntrega: editForm.motivoNoEntrega || undefined,
      });
      alert('Estado actualizado exitosamente');
      setEditingId(null);
      fetchOrders();
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      alert(error.response?.data?.error || 'Error al actualizar estado');
    } finally {
      setSaving(false);
    }
  };

  const getEstadoInfo = (estado: string) => {
    return ESTADOS_ENTREGA.find(e => e.value === estado) || ESTADOS_ENTREGA[0];
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-700 dark:text-white flex items-center gap-3">
              <Package className="w-8 h-8" />
              Gestión de Pedidos
            </h1>
            <p className="text-purple-600 dark:text-white mt-1">
              Administra el estado de entrega de los pedidos
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-center text-gray-600">Cargando pedidos...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const isEditing = editingId === order.id;
              const estadoInfo = getEstadoInfo(order.estadoEntrega);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-purple-700 dark:text-white">
                        {order.numeroOrden}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.usuario.nombre} {order.usuario.apellido} • {order.usuario.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(new Date(order.fecha))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-700 dark:text-white">
                        {formatPrice(order.total)}
                      </p>
                      {!isEditing && (
                        <button
                          onClick={() => handleEdit(order)}
                          className="mt-2 flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                        >
                          <Edit size={14} />
                          Editar Estado
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dirección o Tipo de Entrega */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                    {order.fulfillmentType === 'pickup' ? (
                      <>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Tipo de Entrega:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          🏪 Retiro en tienda
                        </p>
                        {order.pickupLocationId && SUCURSALES[order.pickupLocationId as keyof typeof SUCURSALES] ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2 mt-2">
                            <p className="text-xs text-green-800 dark:text-green-400 font-bold mb-1">
                              ✓ Sucursal seleccionada:
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300 font-semibold">
                              {SUCURSALES[order.pickupLocationId as keyof typeof SUCURSALES].nombre}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {SUCURSALES[order.pickupLocationId as keyof typeof SUCURSALES].direccion}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">
                            (Sucursal no especificada)
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Dirección de Entrega:
                        </p>
                        {order.direccionEnvio ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.direccionEnvio.calle}, {order.direccionEnvio.ciudad}, {order.direccionEnvio.provincia} (CP: {order.direccionEnvio.codigoPostal})
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                            Dirección no especificada
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Estado Actual */}
                  {!isEditing ? (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Estado Actual:
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${estadoInfo.color}`}>
                        {estadoInfo.label}
                      </span>
                      {order.intentosEntrega > 0 && (
                        <span className="ml-2 text-sm text-gray-600">
                          ({order.intentosEntrega} intento{order.intentosEntrega > 1 ? 's' : ''} de entrega)
                        </span>
                      )}
                      {order.confirmoRecepcion && (
                        <span className="ml-2 text-sm text-green-600 font-medium">
                          ✓ Cliente confirmó recepción
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 space-y-3 bg-purple-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 dark:text-white mb-2">
                          Nuevo Estado de Entrega:
                        </label>
                        <select
                          value={editForm.estadoEntrega}
                          onChange={(e) => setEditForm({ ...editForm, estadoEntrega: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-purple-700 dark:text-white"
                        >
                          {ESTADOS_ENTREGA.map((estado) => (
                            <option key={estado.value} value={estado.value}>
                              {estado.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {editForm.estadoEntrega === 'VISITADO_NO_ENTREGADO' && (
                        <div>
                          <label className="block text-sm font-semibold text-purple-700 dark:text-white mb-2">
                            Motivo de No Entrega:
                          </label>
                          <input
                            type="text"
                            value={editForm.motivoNoEntrega}
                            onChange={(e) => setEditForm({ ...editForm, motivoNoEntrega: e.target.value })}
                            placeholder="Ej: No había nadie en el domicilio"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-purple-700 dark:text-white"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-purple-700 dark:text-white mb-2">
                          Notas Adicionales (opcional):
                        </label>
                        <textarea
                          value={editForm.notas}
                          onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                          placeholder="Información adicional sobre el cambio de estado..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-purple-700 dark:text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(order.id)}
                          disabled={saving || !editForm.estadoEntrega}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <Save size={16} />
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="flex items-center gap-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>

                      {order.intentosEntrega >= 1 && editForm.estadoEntrega === 'VISITADO_NO_ENTREGADO' && (
                        <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                          <p className="text-sm text-orange-800">
                            ⚠️ Advertencia: Este será el intento #{order.intentosEntrega + 1}.
                            {order.intentosEntrega >= 1 && ' Después de 2 intentos, el pedido pasará automáticamente a Retiro en Local.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Productos */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Productos ({order.items.length}):
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {item.product?.imagenes?.[0] && (
                              <img
                                src={item.product.imagenes[0].url}
                                alt={item.product.nombre}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-white truncate">
                              {item.product?.nombre || 'Producto no disponible'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Cant: {item.cantidad} • Talle: {item.talle}
                              {item.color && ` • Color: ${item.color}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-purple-700 dark:text-white">
                              {formatPrice(item.precioUnitario * item.cantidad)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">
                No hay pedidos
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Los pedidos aparecerán aquí cuando los clientes realicen compras
              </p>
            </div>
          </div>
        )}
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(GestionPedidosPage);
