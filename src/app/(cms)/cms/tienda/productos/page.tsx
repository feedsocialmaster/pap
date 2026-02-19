'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit, Trash2, Filter, TrendingDown, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import axios from '@/lib/axios';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { ForceDeleteProductButton } from '@/components/cms/ForceDeleteProductButton';
import { useAuthStore } from '@/store/authStore';

interface DisponibilidadColor {
  colorName: string;
  colorCode: string;
  talles: Array<{
    talle: number;
    stockActual: number;
    vendidos: number;
  }>;
}

interface ProductoConEstadisticas {
  id: string;
  codigoProducto: string | null;
  nombre: string;
  slug: string;
  precio: number;
  enLiquidacion: boolean;
  porcentajeDescuento: number | null;
  tipoCalzado: string;
  imagen: string | null;
  stockTotal: number;
  stockLegacy: number;
  totalVendido: number;
  totalVentas: number;
  cantidadVariantes: number;
  disponibilidadPorColor: DisponibilidadColor[];
}

interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  porcentajeDescuento: number | null;
  enLiquidacion: boolean;
  tipoCalzado: string;
  imagenes: { url: string; alt?: string }[];
  stock: number;
  esFiesta: boolean;
  impermeable: boolean;
  antideslizante: boolean;
  codigoProducto?: string;
}

interface Estadisticas {
  totalProductos: number;
  productosEnLiquidacion: number;
  productosSinStock: number;
  productosStockBajo: number;
  totalStock: number;
}

function ProductosPage() {
  const { user } = useAuthStore();
  const userRole = user?.role || '';
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosConEstadisticas, setProductosConEstadisticas] = useState<ProductoConEstadisticas[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroLiquidacion, setFiltroLiquidacion] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('fechaCreacion');
  const [orden, setOrden] = useState('desc');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [vistaActual, setVistaActual] = useState<'simple' | 'detallada'>('simple');
  const [productoExpandido, setProductoExpandido] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [busqueda, filtroTipo, filtroLiquidacion, ordenarPor, orden, pagina]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const params: any = {
        pagina,
        limite: 20,
        ordenarPor,
        orden,
      };

      if (busqueda) params.busqueda = busqueda;
      if (filtroTipo) params.tipoCalzado = filtroTipo;
      if (filtroLiquidacion) params.enLiquidacion = filtroLiquidacion;

      const [productosRes, estadisticasRes, productosEstadisticasRes] = await Promise.all([
        axios.get('/cms/productos', { params }),
        axios.get('/cms/productos/estadisticas'),
        axios.get('/cms/productos/con-estadisticas'),
      ]);

      setProductos(productosRes.data.productos);
      setTotalPaginas(productosRes.data.paginacion.totalPaginas);
      setEstadisticas(estadisticasRes.data);
      setProductosConEstadisticas(productosEstadisticasRes.data.productos);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const eliminarProducto = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) {
      return;
    }

    try {
      await axios.delete(`/cms/productos/${id}`);
      alert('✅ Producto eliminado correctamente');
      cargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar producto:', error);
      
      // Extraer mensaje de error detallado
      const errorData = error.response?.data;
      let mensaje = 'Error al eliminar producto';
      
      if (errorData) {
        mensaje = errorData.error || mensaje;
        
        // Si hay detalles adicionales, mostrarlos
        if (errorData.detalles) {
          const detalles = errorData.detalles;
          if (detalles.totalOrdenes) {
            mensaje += `\n\n📊 Detalles:\n`;
            mensaje += `• Items en órdenes: ${detalles.totalItems}\n`;
            mensaje += `• Total de órdenes: ${detalles.totalOrdenes}\n`;
            mensaje += `• Órdenes activas: ${detalles.ordenesActivas}\n`;
            if (detalles.mensaje) {
              mensaje += `\n💡 ${detalles.mensaje}`;
            }
          }
        }
        
        // Si hay sugerencia de solución
        if (errorData.solucion) {
          mensaje += `\n\n💡 ${errorData.solucion}`;
        }
      }
      
      alert(mensaje);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price / 100);
  };

  const tiposCalzado = [
    'ZAPATILLAS',
    'BOTAS',
    'SANDALIAS',
    'MOCASINES',
    'PLATAFORMAS',
    'BALLERINAS',
    'DEPORTIVAS',
  ];

  if (loading && !productos.length) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600">Cargando productos...</p>
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
              <Package className="w-8 h-8 text-primary" />
              Gestión de Productos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Administra el catálogo de productos de la tienda
            </p>
          </div>

          <Link
            href="/cms/tienda/productos/crear"
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Producto
          </Link>
        </div>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Productos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {estadisticas.totalProductos}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En Liquidación</p>
              <p className="text-3xl font-bold text-red-600">
                {estadisticas.productosEnLiquidacion}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sin Stock</p>
              <p className="text-3xl font-bold text-orange-600">
                {estadisticas.productosSinStock}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stock Bajo</p>
              <p className="text-3xl font-bold text-yellow-600">
                {estadisticas.productosStockBajo}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stock Total</p>
              <p className="text-3xl font-bold text-green-600">
                {estadisticas.totalStock}
              </p>
            </div>
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Búsqueda */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o slug..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Alternar Vista */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setVistaActual('simple')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  vistaActual === 'simple'
                    ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Package className="w-4 h-4" />
                Simple
              </button>
              <button
                onClick={() => setVistaActual('detallada')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  vistaActual === 'detallada'
                    ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Eye className="w-4 h-4" />
                Detallada
              </button>
            </div>

            {/* Botón Filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
          </div>

          {/* Panel de Filtros */}
          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Calzado
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value);
                    setPagina(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos</option>
                  {tiposCalzado.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filtroLiquidacion}
                  onChange={(e) => {
                    setFiltroLiquidacion(e.target.value);
                    setPagina(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value="true">En Liquidación</option>
                  <option value="false">Sin Liquidación</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="fechaCreacion">Fecha de Creación</option>
                  <option value="nombre">Nombre</option>
                  <option value="precio">Precio</option>
                  <option value="stock">Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Productos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
          {vistaActual === 'simple' ? (
            // Vista Simple (Original)
            productos.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Precio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productos.map((producto) => (
                      <tr
                        key={producto.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {producto.imagenes && producto.imagenes.length > 0 && (
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={producto.imagenes[0].url}
                                  alt={producto.nombre}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {producto.nombre}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{producto.slug}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit">
                            {producto.codigoProducto || '—'}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {producto.tipoCalzado}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            {producto.enLiquidacion && producto.porcentajeDescuento ? (
                              <>
                                <p className="text-sm line-through text-gray-500">
                                  {formatPrice(producto.precio)}
                                </p>
                                <p className="font-bold text-red-600">
                                  {formatPrice(
                                    producto.precio -
                                      (producto.precio * producto.porcentajeDescuento) / 100
                                  )}
                                </p>
                              </>
                            ) : (
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {formatPrice(producto.precio)}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              producto.stock === 0
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : producto.stock <= 10
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}
                          >
                            {producto.stock}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {producto.enLiquidacion && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                <TrendingDown className="w-3 h-3" />
                                {producto.porcentajeDescuento}%
                              </span>
                            )}
                            {producto.esFiesta && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                🎉 Fiesta
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/cms/tienda/productos/editar/${producto.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <ForceDeleteProductButton
                              productId={producto.id}
                              productName={producto.nombre}
                              userRole={userRole}
                              onDeleted={() => cargarDatos()}
                            />
                            <button
                              onClick={() => eliminarProducto(producto.id, producto.nombre)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Vista Detallada con Estadísticas de Ventas y Disponibilidad por Color
            productosConEstadisticas.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {productosConEstadisticas.map((producto) => (
                  <div key={producto.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {/* Info del Producto */}
                      <div className="flex items-center gap-4 flex-1">
                        {producto.imagen && (
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={producto.imagen}
                              alt={producto.nombre}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {producto.nombre}
                            </h3>
                            {producto.codigoProducto && (
                              <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                {producto.codigoProducto}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{producto.tipoCalzado}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatPrice(producto.precio)}
                            </span>
                            {producto.enLiquidacion && producto.porcentajeDescuento && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                <TrendingDown className="w-3 h-3" />
                                {producto.porcentajeDescuento}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cms/tienda/productos/editar/${producto.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <ForceDeleteProductButton
                          productId={producto.id}
                          productName={producto.nombre}
                          userRole={userRole}
                          onDeleted={() => cargarDatos()}
                        />
                        {producto.totalVendido > 0 ? (
                          <div className="relative group">
                            <button
                              className="p-2 text-gray-400 cursor-not-allowed rounded-lg"
                              disabled
                              title={`No se puede eliminar: ${producto.totalVendido} unidades vendidas`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="absolute right-0 bottom-full mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              🔒 Producto con historial de ventas<br/>
                              ({producto.totalVendido} unidades vendidas)
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => eliminarProducto(producto.id, producto.nombre)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Estadísticas de Ventas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Stock Total</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{producto.stockTotal}</p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{producto.cantidadVariantes} variantes</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Unidades Vendidas</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{producto.totalVendido}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Ventas</p>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatPrice(producto.totalVentas)}</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Precio Promedio</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {producto.totalVendido > 0 
                            ? formatPrice(Math.round(producto.totalVentas / producto.totalVendido))
                            : formatPrice(0)}
                        </p>
                      </div>
                    </div>

                    {/* Disponibilidad por Color y Talle */}
                    {producto.disponibilidadPorColor.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <div className="w-1 h-4 bg-primary rounded"></div>
                          Disponibilidad por Color y Talle
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {producto.disponibilidadPorColor.map((color, colorIdx) => {
                            const stockTotal = color.talles.reduce((sum, t) => sum + t.stockActual, 0);
                            const vendidosTotal = color.talles.reduce((sum, t) => sum + t.vendidos, 0);
                            
                            return (
                              <div
                                key={`${color.colorCode}-${colorIdx}`}
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                              >
                                {/* Header del Color */}
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-500 flex-shrink-0"
                                      style={{ backgroundColor: color.colorCode }}
                                      title={color.colorCode}
                                    />
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {color.colorName}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                        {color.colorCode}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Total Stock: <span className="font-semibold text-gray-900 dark:text-white">{stockTotal}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Total Vendidos: <span className="font-semibold text-gray-900 dark:text-white">{vendidosTotal}</span>
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Talles */}
                                <div className="p-3 space-y-2">
                                  {color.talles.map((talleInfo, talleIdx) => (
                                    <div
                                      key={`${color.colorCode}-${talleInfo.talle}-${talleIdx}`}
                                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-600/30 rounded border border-gray-200 dark:border-gray-600"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded font-semibold text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500">
                                          {talleInfo.talle}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Talle</span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
                                          <p className={`text-sm font-bold ${
                                            talleInfo.stockActual === 0 
                                              ? 'text-red-600 dark:text-red-400' 
                                              : talleInfo.stockActual <= 5 
                                                ? 'text-yellow-600 dark:text-yellow-400' 
                                                : 'text-green-600 dark:text-green-400'
                                          }`}>
                                            {talleInfo.stockActual}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Vendidos</p>
                                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {talleInfo.vendidos}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {color.talles.length === 0 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                      No hay talles disponibles
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* Paginación */}
          {vistaActual === 'simple' && totalPaginas > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setPagina((prev) => Math.max(1, prev - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Anterior
              </button>

              <span className="text-sm text-gray-700 dark:text-gray-300">
                Página {pagina} de {totalPaginas}
              </span>

              <button
                onClick={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={pagina === totalPaginas}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(ProductosPage);
