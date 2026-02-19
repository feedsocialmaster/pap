'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import {
  Lightbulb,
  Package,
  ShoppingCart,
  Tag,
  Image as ImageIcon,
  BookOpen,
  Users,
} from 'lucide-react';

function FuncionesPage() {
  const funciones = [
    {
      icon: <Package className="w-8 h-8 text-purple-600" />,
      titulo: 'Gestión de Productos',
      descripcion:
        'Crea, edita y administra productos. Configura variantes por color+talle, stock por variante, SKU y carga de imágenes del producto.',
      color:
        'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800',
    },
    {
      icon: <ShoppingCart className="w-8 h-8 text-blue-600" />,
      titulo: 'Gestión de Pedidos',
      descripcion:
        'Controla pedidos por estado (Pendientes/Realizados/Rechazados). Incluye acciones operativas y actualizaciones en tiempo real cuando el backend está conectado.',
      color:
        'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800',
    },
    {
      icon: <Tag className="w-8 h-8 text-green-600" />,
      titulo: 'Promociones y Códigos',
      descripcion:
        'Crea promociones y administrá códigos promocionales. Podés activar/desactivar, definir vigencia y usar distintos tipos de descuento (incluyendo bundles).',
      color:
        'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800',
    },
    {
      icon: <ImageIcon className="w-8 h-8 text-pink-600" />,
      titulo: 'Imágenes (Banners)',
      descripcion:
        'Gestiona banners del carrusel principal: imagen desktop + mobile, enlace, orden y estado activo.',
      color:
        'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-800',
    },
    {
      icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
      titulo: 'Blog y Contenido',
      descripcion:
        'Publica y administra posts con estados BORRADOR/PUBLICADO/ARCHIVADO, con acciones de archivar y borrar.',
      color:
        'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800',
    },
    {
      icon: <Users className="w-8 h-8 text-teal-600" />,
      titulo: 'Usuarios y Permisos',
      descripcion:
        'Gestiona usuarios del CMS y roles. La visibilidad de esta sección y las acciones disponibles dependen del rol.',
      color:
        'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800',
    },
  ];

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-yellow-500" />
              Funciones del CMS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Herramientas disponibles para administrar la tienda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {funciones.map((funcion, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${funcion.color} rounded-xl p-6 border`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  {funcion.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {funcion.titulo}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {funcion.descripcion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💡 Consejos Útiles
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-lg">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Stock por variante:</strong> gestioná inventario por combinación de color + talle.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-lg">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Imágenes:</strong> mantené una portada clara y sumá fotos para mostrar detalles.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-lg">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Tiempo real:</strong> si el backend está disponible, pedidos y notificaciones se actualizan sin recargar.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-lg">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Promos vs códigos:</strong> usá promociones para campañas generales y códigos para acciones puntuales.
              </p>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-600 font-bold text-lg">•</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Banners:</strong> configurá versión desktop y mobile, orden y enlace; activá/desactivá sin borrar.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(FuncionesPage);
