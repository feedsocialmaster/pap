'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff, Calendar, TrendingUp, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import axios from '@/lib/axios';
import { logApiError, shouldSilenceError } from '@/lib/api';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';

interface CodigoPromocional {
  id: string;
  codigo: string;
  descuento: number;
  tipoBundle?: string | null;
  exclusivoConPromociones?: boolean;
  activo: boolean;
  createdAt: string;
}

const TIPO_BUNDLE_LABELS: Record<string, string> = {
  DOS_POR_UNO: '2x1',
  TRES_POR_DOS: '3x2',
  CUATRO_POR_TRES: '4x3',
  CINCO_POR_DOS: '5x2',
  CINCO_POR_TRES: '5x3',
};

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string;
  slug: string;
  imagenUrl: string | null;
  tipoDescuento: string;
  valorDescuento: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  destacado: boolean;
  usosActuales: number;
  usosMaximos: number | null;
}

interface Estadisticas {
  totalPromociones: number;
  promocionesActivas: number;
  promocionesVigentes: number;
  promocionesDestacadas: number;
  totalUsos: number;
}

function PromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [codigosPromocionales, setCodigosPromocionales] = useState<CodigoPromocional[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [promocionesRes, estadisticasRes, codigosRes] = await Promise.all([
        axios.get('/cms/promociones'),
        axios.get('/cms/promociones/estadisticas'),
        axios.get('/cms/promociones/codigos'),
      ]);

      setPromociones(promocionesRes.data.promociones);
      setEstadisticas(estadisticasRes.data);
      setCodigosPromocionales(codigosRes.data.codigos);
    } catch (error) {
      logApiError(error, 'cargarDatos - Promociones');
      if (!shouldSilenceError(error)) {
        alert('Error al cargar promociones');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (id: string) => {
    try {
      await axios.put(`/cms/promociones/${id}/toggle`);
      cargarDatos();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado');
    }
  };

  const eliminarPromocion = async (id: string, titulo: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${titulo}"?`)) {
      return;
    }

    try {
      await axios.delete(`/cms/promociones/${id}`);
      alert('✅ Promoción eliminada correctamente');
      cargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar promoción:', error);
      alert(error.response?.data?.error || 'Error al eliminar promoción');
    }
  };

  const toggleCodigoActivo = async (id: string) => {
    try {
      await axios.put(`/cms/promociones/codigos/${id}/toggle`);
      cargarDatos();
    } catch (error) {
      console.error('Error al cambiar estado del código:', error);
      alert('Error al cambiar estado del código');
    }
  };

  const eliminarCodigo = async (id: string, codigo: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el código "${codigo}"?`)) {
      return;
    }

    try {
      await axios.delete(`/cms/promociones/codigos/${id}`);
      alert('✅ Código eliminado correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al eliminar código:', error);
      alert('Error al eliminar código');
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const formatDescuento = (tipo: string, valor: number) => {
    if (tipo === 'PORCENTAJE') return `${valor}% OFF`;
    if (tipo === 'MONTO_FIJO') return `-$${(valor / 100).toFixed(2)}`;
    if (tipo === 'DOS_POR_UNO') return '2x1';
    return '';
  };

  const estaVigente = (inicio: string, fin: string) => {
    const ahora = new Date();
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    return ahora >= fechaInicio && ahora <= fechaFin;
  };

  if (loading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Cargando promociones...</p>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-primary" />
              Gestión de Promociones
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Administra las promociones y ofertas especiales
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cms/tienda/promociones/codigos/crear"
              className="flex items-center gap-2 bg-green-400 dark:bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-500 dark:hover:bg-green-600 hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Crear Código Promocional
            </Link>
            
            <Link
              href="/cms/tienda/promociones/crear"
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 hover:text-white transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Promoción
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Promociones</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {estadisticas.totalPromociones}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Activas</p>
              <p className="text-3xl font-bold text-green-600">
                {estadisticas.promocionesActivas}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vigentes</p>
              <p className="text-3xl font-bold text-blue-600">
                {estadisticas.promocionesVigentes}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Destacadas</p>
              <p className="text-3xl font-bold text-purple-600">
                {estadisticas.promocionesDestacadas}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Usos</p>
              <p className="text-3xl font-bold text-orange-600">
                {estadisticas.totalUsos}
              </p>
            </div>
          </div>
        )}

        {/* Códigos Promocionales */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Tag className="w-6 h-6 text-green-500" />
            Códigos Promocionales
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {codigosPromocionales.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay códigos promocionales creados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Descuento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {codigosPromocionales.map((codigo) => (
                      <tr key={codigo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Tag className="w-4 h-4 mr-2 text-green-500" />
                            <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                              {codigo.codigo}
                            </span>
                          </div>
                          {codigo.exclusivoConPromociones && (
                            <span className="text-xs text-orange-600 dark:text-orange-400 mt-1 block">
                              ⚠️ No combinable con promociones
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {codigo.descuento}% OFF
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {codigo.tipoBundle ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                              {TIPO_BUNDLE_LABELS[codigo.tipoBundle] || codigo.tipoBundle}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Porcentual
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              codigo.activo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {codigo.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(codigo.createdAt).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleCodigoActivo(codigo.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                codigo.activo
                                  ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200'
                                  : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400'
                              }`}
                              title={codigo.activo ? 'Desactivar' : 'Activar'}
                            >
                              {codigo.activo ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => eliminarCodigo(codigo.id, codigo.codigo)}
                              className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors text-red-600 dark:text-red-400"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Promociones */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Promociones Especiales
          </h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">{promociones.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Megaphone className="w-16 h-16 mx-auto mb-3 text-gray-300" />
              <p>No hay promociones creadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {promociones.map((promo) => {
                const vigente = estaVigente(promo.fechaInicio, promo.fechaFin);
                
                return (
                  <div
                    key={promo.id}
                    className={`bg-white dark:bg-gray-700 rounded-lg border-2 overflow-hidden ${
                      promo.destacado
                        ? 'border-purple-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {/* Imagen */}
                    {promo.imagenUrl && (
                      <div className="relative h-40 bg-gray-100 dark:bg-gray-600">
                        <Image
                          src={promo.imagenUrl}
                          alt={promo.titulo}
                          width={400}
                          height={160}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-5">
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {promo.destacado && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            ⭐ Destacado
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            promo.activo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {promo.activo ? 'Activa' : 'Inactiva'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            vigente
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}
                        >
                          {vigente ? '✓ Vigente' : 'No vigente'}
                        </span>
                      </div>

                      {/* Título */}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {promo.titulo}
                      </h3>

                      {/* Descuento */}
                      <div className="mb-3">
                        <span className="inline-block px-4 py-2 bg-red-500 text-white text-xl font-bold rounded-lg">
                          {formatDescuento(promo.tipoDescuento, promo.valorDescuento)}
                        </span>
                      </div>

                      {/* Fechas */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(promo.fechaInicio)} - {formatDate(promo.fechaFin)}
                        </span>
                      </div>

                      {/* Usos */}
                      {promo.usosMaximos && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            Usos: {promo.usosActuales} / {promo.usosMaximos}
                          </span>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActivo(promo.id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            promo.activo
                              ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200'
                              : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400'
                          }`}
                          title={promo.activo ? 'Desactivar' : 'Activar'}
                        >
                          {promo.activo ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                        <Link
                          href={`/cms/tienda/promociones/editar/${promo.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => eliminarPromocion(promo.id, promo.titulo)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(PromocionesPage);
