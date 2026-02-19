'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Package, Image, Layers, ShoppingCart } from 'lucide-react';
import axios from '@/lib/axios';

interface ForceDeleteProductButtonProps {
  productId: string;
  productName: string;
  userRole: string;
  onDeleted?: () => void;
  className?: string;
}

const ALLOWED_ROLES = ['SUPER_SU', 'DESARROLLADOR'];

export function ForceDeleteProductButton({
  productId,
  productName,
  userRole,
  onDeleted,
  className = ''
}: ForceDeleteProductButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo mostrar para roles permitidos
  if (!ALLOWED_ROLES.includes(userRole)) {
    return null;
  }

  const handleForceDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await axios.post(`/cms/productos/${productId}/force-delete`);
      
      if (response.data.success) {
        const { deletedOrders, deletedImages, deletedVariants } = response.data.data;
        
        alert(
          `✅ Producto eliminado exitosamente\n\n` +
          `📦 Producto: ${productName}\n` +
          `🗑️ Órdenes eliminadas: ${deletedOrders}\n` +
          `🖼️ Imágenes eliminadas: ${deletedImages}\n` +
          `📊 Variantes eliminadas: ${deletedVariants}`
        );
        
        setIsModalOpen(false);
        onDeleted?.();
      }
    } catch (err: any) {
      console.error('Error en borrado forzoso:', err);
      
      const errorMessage = err.response?.data?.error || 'Error al eliminar producto';
      const correlationId = err.response?.data?.correlationId;
      
      setError(
        `${errorMessage}${correlationId ? `\n\nID de correlación: ${correlationId}` : ''}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Botón de borrado forzoso */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors ${className}`}
        title="Borrar producto (forzoso)"
      >
        <AlertTriangle className="w-5 h-5" />
      </button>

      {/* Modal de confirmación */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isDeleting && setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente */}
            <div className="relative bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Borrar producto (forzoso)
                  </h3>
                  <p className="text-white/80 text-sm mt-0.5">Acción irreversible</p>
                </div>
              </div>
              {!isDeleting && (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-5">
              {/* Nombre del producto */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Producto a eliminar
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white truncate mt-0.5">
                    {productName}
                  </p>
                </div>
              </div>

              {/* Mensaje de advertencia */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl">
                <p className="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                  Perderá todos sus registros previos. Encárguese de haber realizado una copia 
                  de seguridad de todas sus órdenes anteriores para mayor control.
                </p>
              </div>

              {/* Información adicional */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Esta acción eliminará permanentemente:
                </p>
                <div className="grid gap-2.5">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-md">
                      <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      El producto y todas sus imágenes
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/40 rounded-md">
                      <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Todas las variantes (colores y talles)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/40 rounded-md">
                      <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Órdenes pendientes relacionadas
                    </span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl">
                  <p className="text-red-700 dark:text-red-300 text-sm whitespace-pre-line">{error}</p>
                </div>
              )}
            </div>

            {/* Footer con botones */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDeleting}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                         border border-gray-300 dark:border-gray-600
                         hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-colors font-medium
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleForceDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl 
                         transition-colors flex items-center gap-2 font-medium shadow-lg shadow-red-500/25
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Aceptar borrado
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ForceDeleteProductButton;
