'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ShoppingBag,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History
} from 'lucide-react';
import axios from '@/lib/axios';
import { cn, formatPrice } from '@/utils/format';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  telefono: string | null;
  whatsapp: string | null;
  direccion: any;
  role: string;
  fechaRegistro: string;
  activo: boolean;
  suspendido: boolean;
  motivoSuspension: string | null;
  fechaSuspension: string | null;
}

interface HistorialCompras {
  ordenes: any[];
  eventosLealtad: any[];
  estadisticas: {
    totalOrdenes: number;
    totalGastado: number;
    ordenPromedio: number;
  };
}

interface Props {
  usuario: Usuario | null;
  onClose: () => void;
  onActualizar: () => void;
}

export function UsuarioDetalleModal({ usuario, onClose, onActualizar }: Props) {
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState<HistorialCompras | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState<'suspender' | 'activar' | 'inhabilitar' | null>(null);
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    if (usuario) {
      cargarHistorial();
    }
  }, [usuario]);

  const cargarHistorial = async () => {
    if (!usuario) return;

    try {
      setCargando(true);
      const response = await axios.get(`/cms/usuarios/${usuario.id}/historial`);
      setHistorial(response.data);
    } catch (error: any) {
      console.error('Error al cargar historial:', error);
    } finally {
      setCargando(false);
    }
  };

  const confirmarAccion = (accion: 'suspender' | 'activar' | 'inhabilitar') => {
    setAccionPendiente(accion);
    setMostrarConfirmacion(true);
  };

  const ejecutarAccion = async () => {
    if (!usuario || !accionPendiente) return;

    if ((accionPendiente === 'suspender' || accionPendiente === 'inhabilitar') && !motivo.trim()) {
      alert('Debes proporcionar un motivo');
      return;
    }

    try {
      await axios.patch(`/cms/usuarios/${usuario.id}/estado`, {
        accion: accionPendiente,
        motivo: motivo.trim() || undefined
      });

      alert(`Usuario ${accionPendiente === 'activar' ? 'activado' : accionPendiente === 'suspender' ? 'suspendido' : 'inhabilitado'} exitosamente`);
      setMostrarConfirmacion(false);
      setMotivo('');
      setAccionPendiente(null);
      onActualizar();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || `Error al ${accionPendiente} usuario`);
    }
  };

  const cancelarAccion = () => {
    setMostrarConfirmacion(false);
    setMotivo('');
    setAccionPendiente(null);
  };

  if (!usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {usuario.nombre} {usuario.apellido}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{usuario.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="Cerrar"
            aria-label="Cerrar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Estado del usuario */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {usuario.activo && !usuario.suspendido ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Activo</span>
                    </>
                  ) : usuario.suspendido ? (
                    <>
                      <Ban className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-400">Suspendido</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Inactivo</span>
                    </>
                  )}
                </div>

                {usuario.motivoSuspension && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Motivo:</span> {usuario.motivoSuspension}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                {usuario.suspendido || !usuario.activo ? (
                  <button
                    onClick={() => confirmarAccion('activar')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Activar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => confirmarAccion('suspender')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Suspender
                    </button>
                    <button
                      onClick={() => confirmarAccion('inhabilitar')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Inhabilitar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Información personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{usuario.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>Teléfono Celular: {usuario.telefono || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Nació: {new Date(usuario.fechaNacimiento).toLocaleDateString('es-AR')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Miembro desde: {new Date(usuario.fechaRegistro).toLocaleDateString('es-AR')}</span>
                </div>
                {usuario.direccion && (
                  <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <div>
                      <p>{usuario.direccion.calle} {usuario.direccion.numero}</p>
                      <p>{usuario.direccion.ciudad}, {usuario.direccion.provincia}</p>
                      <p>CP: {usuario.direccion.codigoPostal}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Rol y Estado
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rol:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {usuario.role === 'SUPER_SU' ? 'Super Usuario' : 
                     usuario.role === 'ADMIN_CMS' ? 'Administrador' : 
                     usuario.role === 'VENDEDOR' ? 'Vendedor' : 'Cliente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {usuario.activo && !usuario.suspendido ? 'Activo' : 
                     usuario.suspendido ? 'Suspendido' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Historial de compras */}
          {cargando ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando historial...</p>
            </div>
          ) : historial && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Historial de Compras
              </h3>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{historial.estadisticas.totalOrdenes}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Órdenes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(historial.estadisticas.totalGastado)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Gastado</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(historial.estadisticas.ordenPromedio)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Promedio</p>
                </div>
              </div>

              {/* Últimas órdenes */}
              {historial.ordenes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Últimas Órdenes</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {historial.ordenes.slice(0, 5).map((orden) => (
                      <div 
                        key={orden.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Orden #{orden.codigoCompra || orden.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(orden.fecha).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatPrice(orden.total)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{orden.items.length} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de confirmación */}
        {mostrarConfirmacion && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-start gap-4 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Confirmar {accionPendiente}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ¿Estás seguro de que deseas {accionPendiente} a {usuario.nombre} {usuario.apellido}?
                  </p>
                </div>
              </div>

              {(accionPendiente === 'suspender' || accionPendiente === 'inhabilitar') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motivo *
                  </label>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    placeholder="Explica el motivo..."
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={cancelarAccion}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={ejecutarAccion}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-white transition-colors',
                    accionPendiente === 'activar' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : accionPendiente === 'suspender'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
