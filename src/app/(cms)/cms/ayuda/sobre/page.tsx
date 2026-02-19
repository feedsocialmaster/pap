'use client';

import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { BookOpen } from 'lucide-react';

function AyudaSobrePageContent() {
  return (
    <CMSLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sobre el CMS
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              CMS Paso a Paso Shoes
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Panel interno para administrar el contenido y la operación diaria de la tienda.
              Desde aquí podés gestionar el catálogo (productos y variantes), el blog, los
              banners del carrusel, promociones y cupones, y pedidos.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Información de Versión
            </h3>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Versión:</span> 1.0.0
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Compilación:</span> 1000
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Cómo funciona (resumen)
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                El CMS está construido como una aplicación web con navegación por secciones,
                autenticación y control por roles.
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                  <span><strong>Acceso protegido:</strong> si no hay sesión válida, redirige a <code>/cms/login</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                  <span><strong>Permisos por rol:</strong> algunas secciones se ocultan o limitan según el rol (por ejemplo, Gestión de Usuarios no aparece para <strong>VENDEDOR</strong>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                  <span><strong>Tiempo real:</strong> se reciben eventos de pedidos/notificaciones vía WebSocket (Socket.IO) cuando el backend está disponible.</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Qué podés hacer hoy
            </h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Productos:</strong> alta/edición/baja, liquidación, imágenes (hasta 8), talles y colores con variantes (stock por color+talle) y SKU por variante.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Pedidos:</strong> pendientes (aprobar/rechazar), realizados (seguimiento por estados) y rechazados (pago/stock/cancelación).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Promociones:</strong> descuentos por porcentaje, monto fijo y bundles (ej. 2x1) + códigos promocionales con activación/desactivación.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Notificaciones internas:</strong> campana en el header + notificaciones del navegador para eventos del CMS (ej. nuevo pedido).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Blog:</strong> crear/editar, filtrar por estado (BORRADOR/PUBLICADO/ARCHIVADO), archivar y borrar.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Imágenes:</strong> gestión de banners del carrusel con versión desktop + mobile, enlace, orden y estado activo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Usuarios:</strong> crear/editar/borrar (según permisos), ver detalle y filtrar por rol.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Tour interactivo:</strong> recorrido guiado por las secciones principales.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                <span><strong>Tema:</strong> modo claro/oscuro persistente.</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Módulos Disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Gestión de Tienda</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Blog</li>
                  <li>• Productos</li>
                  <li>• Imágenes de la Tienda Web (banners)</li>
                  <li>• Promociones (y códigos promocionales)</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Operación</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Pedidos de clientes (Pendientes / Realizados / Rechazados)</li>
                  <li>• Notificaciones del CMS (campana + navegador)</li>
                  <li>• Gestión de Usuarios (según permisos)</li>
                  <li>• Tour interactivo y páginas de ayuda</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Soporte y Ayuda
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Si tenés dudas sobre el uso del panel, revisá las secciones de Ayuda o realizá el
              tour interactivo. Para temas técnicos (errores, permisos o configuración), contactá
              al equipo técnico.
            </p>
          </section>
        </div>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(AyudaSobrePageContent);
