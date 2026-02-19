'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { Map, Play, CheckCircle } from 'lucide-react';
import { useTourContext } from '@/components/cms/TourProvider';

function TourPage() {
  const { startTour } = useTourContext();

  const pasos = [
    {
      numero: 1,
      titulo: 'Gestión de Productos',
      descripcion: 'Administra el catálogo: crear/editar productos, cargar imágenes, configurar liquidación y gestionar variantes (stock por color+talle y SKU por variante).',
      ruta: '/cms/tienda/productos'
    },
    {
      numero: 2,
      titulo: 'Gestión de Pedidos',
      descripcion: 'Revisa pedidos y realiza acciones operativas. Desde el menú también tenés accesos directos a Pendientes, Realizados y Rechazados.',
      ruta: '/cms/pedidos'
    },
    {
      numero: 3,
      titulo: 'Promociones y Códigos',
      descripcion: 'Crea promociones (vigencia/estado) y administra códigos promocionales. Útil para campañas y descuentos controlados.',
      ruta: '/cms/tienda/promociones'
    },
    {
      numero: 4,
      titulo: 'Blog y Contenido',
      descripcion: 'Gestiona posts del blog: crear/editar, filtrar por estado (BORRADOR/PUBLICADO/ARCHIVADO), archivar o borrar.',
      ruta: '/cms/tienda/blog'
    },
    {
      numero: 5,
      titulo: 'Imágenes y Banners',
      descripcion: 'Administra banners del carrusel: imagen desktop + mobile, enlace, orden y estado activo.',
      ruta: '/cms/tienda/imagenes'
    },
    {
      numero: 6,
      titulo: 'Usuarios del CMS',
      descripcion: 'Gestiona usuarios y roles del CMS. Esta sección puede estar restringida según permisos.',
      ruta: '/cms/usuarios'
    }
  ];

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Map className="w-8 h-8 text-purple-600" />
              Realizar Tour por el CMS
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Recorrido guiado por todas las funciones principales
            </p>
          </div>
          <button 
            onClick={startTour}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            <Play className="w-5 h-5" />
            Iniciar Tour Interactivo
          </button>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>👋 ¡Bienvenido/a!</strong> Este tour te guía por las <strong>6 secciones principales</strong> del CMS.
            Vas a recorrer el catálogo, pedidos, promociones, blog, banners y usuarios.
          </p>
        </div>

        <div className="space-y-4">
          {pasos.map((paso, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-md">
                  {paso.numero}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {paso.titulo}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {paso.descripcion}
                  </p>
                  <a
                    href={paso.ruta}
                    className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    Ir a esta sección →
                  </a>
                </div>
                <CheckCircle className="w-6 h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ¿Listo para comenzar?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Haz clic en "Iniciar Tour Interactivo" para una experiencia guiada paso a paso, 
              o explora cada sección a tu propio ritmo.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={startTour}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                Iniciar Tour
              </button>
              <a
                href="/cms/tienda/productos"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Ir a Productos
              </a>
            </div>
          </div>
        </div>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(TourPage);
