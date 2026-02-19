'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function PreguntasPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      pregunta: '¿Quién puede acceder al CMS?',
      respuesta: 'El acceso está protegido por sesión y rol. Si no hay una sesión válida, el sistema redirige a /cms/login. Además, algunas secciones y acciones se habilitan o se ocultan según el rol del usuario.'
    },
    {
      pregunta: '¿Cómo agrego un nuevo producto?',
      respuesta: 'Ve a "Tienda Web" > "Productos" y haz clic en "Crear". Completa nombre, precio, descripción y el resto de datos del producto. Luego configura variantes (colores y talles), stock por variante y carga imágenes. Finalmente guarda los cambios.'
    },
    {
      pregunta: '¿Cómo funciona el sistema de variantes de color?',
      respuesta: 'Las variantes se gestionan por combinación de color + talle. Cada combinación puede tener su propio stock y SKU. Esto permite controlar inventario de forma precisa por variante.'
    },
    {
      pregunta: '¿Cómo modifico el stock y el SKU?',
      respuesta: 'En "Tienda Web" > "Productos" abre el producto en "Editar". En el editor de variantes podrás ajustar stock por color+talle y editar el SKU de cada combinación.'
    },
    {
      pregunta: '¿Cómo creo una promoción?',
      respuesta: 'Navega a "Tienda Web" > "Promociones" y crea una nueva promoción. Define nombre, tipo de descuento (porcentaje, monto fijo o bundle), vigencia y estado (activa/inactiva).'
    },
    {
      pregunta: '¿Cómo creo códigos promocionales?',
      respuesta: 'Dentro de "Promociones" podés administrar los códigos promocionales: crear, activar/desactivar y borrar. Úsalos para campañas puntuales donde el cliente ingresa un código.'
    },
    {
      pregunta: '¿Cómo funcionan las notificaciones en tiempo real?',
      respuesta: 'Cuando el backend está disponible, el CMS se conecta por WebSocket y recibe eventos de pedidos y notificaciones. La campana del header muestra un contador de no leídas y permite navegar a los pedidos relacionados.'
    },
    {
      pregunta: '¿Cómo gestiono los pedidos de clientes?',
      respuesta: 'En "Pedidos de Clientes" tenés tres secciones: Pendientes, Realizados y Rechazados. En Pendientes podrás aprobar o rechazar; en Realizados podrás filtrar por fechas/estado y exportar; en Rechazados verás los pedidos con errores o cancelaciones.'
    },
    {
      pregunta: '¿Cómo exporto pedidos?',
      respuesta: 'En "Pedidos de Clientes" > "Realizados" encontrarás opciones de exportación (por ejemplo, a CSV) según el rango de fechas/estado que estés visualizando.'
    },
    {
      pregunta: '¿Cómo gestiono el blog?',
      respuesta: 'En "Tienda Web" > "Blog" podés crear y editar posts, filtrar por estado (BORRADOR/PUBLICADO/ARCHIVADO) y archivar o borrar contenido.'
    },
    {
      pregunta: '¿Cómo subo banners para el carrusel?',
      respuesta: 'Ve a "Tienda Web" > "Imágenes de la Tienda Web". Podés cargar banners con imagen desktop y mobile, definir el enlace, el orden y activar/desactivar sin borrar.'
    },
    {
      pregunta: '¿Cómo cambio entre tema claro y oscuro?',
      respuesta: 'Haz clic en el ícono de sol/luna en el header superior derecho del CMS. El tema se guarda automáticamente en tu navegador (localStorage) y se aplica en todas tus sesiones futuras. El modo oscuro reduce la fatiga visual durante el uso prolongado y afecta todo el CMS, incluyendo tablas, modales y formularios.'
    },
    {
      pregunta: '¿Cómo gestiono categorías?',
      respuesta: 'En "Tienda Web" > "Categorías" podés crear, editar y borrar categorías. Se usan para organizar productos y mejorar la navegación en la tienda.'
    },
    {
      pregunta: '¿Quién puede gestionar usuarios?',
      respuesta: 'La sección "Gestión de Usuarios" aparece solo para roles con permiso. Además, ciertas acciones (como borrado forzoso de productos) están restringidas a roles específicos.'
    }
  ];

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-blue-600" />
              Preguntas y Respuestas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Respuestas a las preguntas más frecuentes
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="font-semibold text-left text-gray-900 dark:text-white">
                      {faq.pregunta}
                    </span>
                    {expandedIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedIndex === index && (
                    <div className="px-6 py-4 bg-white dark:bg-gray-800">
                      <p className="text-gray-700 dark:text-gray-300">
                        {faq.respuesta}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            ¿No encontraste lo que buscabas?
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Contactá al equipo técnico para revisar permisos, accesos o errores del sistema.
          </p>
        </div>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(PreguntasPage);
