'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { Sparkles, Zap, Shield, Package, ShoppingCart, Bell, Tag, Image as ImageIcon, Users, Palette, BookOpen } from 'lucide-react';

function CaracteristicasPage() {
  const caracteristicas = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      titulo: 'Tiempo real (Pedidos y Notificaciones)',
      descripcion: 'Actualizaciones en vivo mediante WebSocket (Socket.IO) para eventos del CMS, como cambios de pedidos y notificaciones internas, sin recargar la página.',
      color: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      titulo: 'Acceso protegido y permisos por rol',
      descripcion: 'El CMS protege el acceso y muestra/limita secciones según rol. Algunas acciones sensibles se habilitan solo para roles específicos.',
      color: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800'
    },
    {
      icon: <Bell className="w-6 h-6 text-red-600" />,
      titulo: 'Notificaciones del CMS',
      descripcion: 'Campana con contador de no leídas, listado de notificaciones y navegación directa (por ejemplo, a pedidos pendientes con foco).',
      color: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
    },
    {
      icon: <Package className="w-6 h-6 text-purple-600" />,
      titulo: 'Catálogo con variantes',
      descripcion: 'Productos con talles/colores, stock por variante y SKU por combinación. Soporta carga de imágenes y edición de datos principales del producto.',
      color: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800'
    },
    {
      icon: <ShoppingCart className="w-6 h-6 text-green-600" />,
      titulo: 'Pedidos por estado',
      descripcion: 'Pantallas dedicadas para Pendientes, Realizados y Rechazados, con acciones operativas y filtros (según la sección).',
      color: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
    },
    {
      icon: <Sparkles className="w-6 h-6 text-pink-600" />,
      titulo: 'Interfaz Moderna y Adaptable',
      descripcion: 'Diseño responsivo con modo claro/oscuro persistente. Navegación por sidebar, toasts de estado y páginas de ayuda integradas.',
      color: 'from-pink-50 to-fuchsia-50 dark:from-pink-900/20 dark:to-fuchsia-900/20 border-pink-200 dark:border-pink-800'
    },
    {
      icon: <Tag className="w-6 h-6 text-orange-600" />,
      titulo: 'Promociones y códigos',
      descripcion: 'Promociones con vigencia/estado y administración de códigos promocionales con activación/desactivación.',
      color: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800'
    },
    {
      icon: <ImageIcon className="w-6 h-6 text-blue-600" />,
      titulo: 'Banners del carrusel',
      descripcion: 'Gestión de banners (desktop + mobile), enlaces, orden y estado activo para el carrusel principal.',
      color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800'
    },
    {
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      titulo: 'Blog y contenido',
      descripcion: 'Posts con estados BORRADOR/PUBLICADO/ARCHIVADO, acciones de archivar y borrar, y gestión desde el panel.',
      color: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800'
    },
    {
      icon: <Users className="w-6 h-6 text-slate-600" />,
      titulo: 'Usuarios (según permisos)',
      descripcion: 'Gestión de usuarios del CMS con roles y acciones restringidas por perfil.',
      color: 'from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 border-slate-200 dark:border-slate-800'
    },
    {
      icon: <Palette className="w-6 h-6 text-violet-600" />,
      titulo: 'Tema claro/oscuro',
      descripcion: 'Preferencia de tema persistente para trabajar en modo claro u oscuro según necesidad.',
      color: 'from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-violet-200 dark:border-violet-800'
    }
  ];

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              Características de las Funciones del CMS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Descubre todo lo que puedes hacer con esta plataforma
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {caracteristicas.map((item, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${item.color} rounded-xl p-6 border`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {item.descripcion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Funcionalidades Destacadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Gestión de Productos y Contenido</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Sistema de variantes: stock por color y talle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Selector de colores (hex) para variantes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>SKU por variante (editable)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Galería de imágenes múltiples por producto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Gestión de categorías y generación de slug</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Blog con estados (BORRADOR/PUBLICADO/ARCHIVADO)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Banners carrusel: desktop + mobile, orden personalizable</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ventas, Promociones y Tecnología</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>WebSocket con auto-reconexión (hasta 5 intentos)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Gestión de pedidos: aprobar/rechazar y actualizar estados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Promociones (%, monto fijo, bundles) y códigos promocionales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Exportación de pedidos (CSV) desde la sección correspondiente</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">🎯 Pensado para la operación diaria</h3>
          <p className="text-purple-100">
            El CMS concentra las tareas habituales (catálogo, banners, promociones, pedidos, blog
            y usuarios) en un flujo simple y consistente.
          </p>
        </div>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(CaracteristicasPage);
