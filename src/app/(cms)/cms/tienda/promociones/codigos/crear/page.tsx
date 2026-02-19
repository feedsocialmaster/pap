'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Tag, Package, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';

const TIPOS_BUNDLE = [
  { value: '', label: 'Sin bundle (descuento porcentual directo)' },
  { value: 'DOS_POR_UNO', label: '2x1 - Paga 1, lleva 2' },
  { value: 'TRES_POR_DOS', label: '3x2 - Paga 2, lleva 3' },
  { value: 'CUATRO_POR_TRES', label: '4x3 - Paga 3, lleva 4' },
  { value: 'CINCO_POR_DOS', label: '5x2 - Paga 2, lleva 5' },
  { value: 'CINCO_POR_TRES', label: '5x3 - Paga 3, lleva 5' },
];

function CrearCodigoPromocionalPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  
  const [codigo, setCodigo] = useState('');
  const [descuento, setDescuento] = useState('');
  const [tipoBundle, setTipoBundle] = useState('');
  const [combinable, setCombinable] = useState(false);
  const [exclusivoConPromociones, setExclusivoConPromociones] = useState(false);

  // Validación: al menos uno de descuento o tipoBundle debe estar presente
  const esValido = codigo.trim() !== '' && (descuento !== '' || tipoBundle !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!esValido) {
      alert('Debes especificar al menos un descuento porcentual o un tipo de bundle');
      return;
    }

    try {
      setGuardando(true);

      const data: any = {
        codigo: codigo.toUpperCase(),
      };

      // Solo enviar descuento si tiene valor
      if (descuento !== '') {
        data.descuento = parseInt(descuento);
      }

      // Si hay tipoBundle, enviarlo
      if (tipoBundle) {
        data.tipoBundle = tipoBundle;
      }

      // Enviar combinable solo si tiene ambos (descuento y bundle)
      if (descuento !== '' && tipoBundle) {
        data.combinable = combinable;
      }

      // Enviar exclusivoConPromociones
      data.exclusivoConPromociones = exclusivoConPromociones;

      await axios.post('/cms/promociones/codigos', data);
      
      alert('✅ Código promocional creado correctamente');
      router.push('/cms/tienda/promociones');
    } catch (error) {
      console.error('Error al crear código:', error);
      let errorMessage = 'Error al crear código promocional';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || errorMessage;
      }
      alert(errorMessage);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <CMSLayout>
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/cms/tienda/promociones"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crear Código Promocional
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Crea un nuevo código de descuento para el carrito
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Código */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Tag className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Información del Código
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Código Promocional *
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  required
                  maxLength={20}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 uppercase"
                  placeholder="Ej: PASO10, VERANO2026"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El código se convertirá automáticamente a mayúsculas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Descuento porcentual (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={descuento}
                    onChange={(e) => setDescuento(e.target.value)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Ej: 10, 15, 20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Opcional si seleccionas un tipo de bundle. Requerido si no hay bundle.
                </p>
              </div>
            </div>
          </div>

          {/* Tipo de Bundle */}
          <div className="hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Tipo de Bundle
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Formato de canje por unidades
                </label>
                <select
                  value={tipoBundle}
                  onChange={(e) => setTipoBundle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  {TIPOS_BUNDLE.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Si seleccionas un tipo de bundle, el descuento se aplicará según el formato elegido
                </p>
              </div>

              {tipoBundle && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>Ejemplo:</strong> Con {TIPOS_BUNDLE.find(t => t.value === tipoBundle)?.label}, 
                    {tipoBundle === 'DOS_POR_UNO' && ' el cliente paga 1 producto y lleva 2.'}
                    {tipoBundle === 'TRES_POR_DOS' && ' el cliente paga 2 productos y lleva 3.'}
                    {tipoBundle === 'CUATRO_POR_TRES' && ' el cliente paga 3 productos y lleva 4.'}
                    {tipoBundle === 'CINCO_POR_DOS' && ' el cliente paga 2 productos y lleva 5.'}
                    {tipoBundle === 'CINCO_POR_TRES' && ' el cliente paga 3 productos y lleva 5.'}
                  </p>
                </div>
              )}

              {/* Opción de combinable - solo visible si hay ambos */}
              {descuento !== '' && tipoBundle && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={combinable}
                      onChange={(e) => setCombinable(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Combinar descuento porcentual con bundle
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {combinable ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            Se aplicará primero el bundle y luego el descuento porcentual sobre el resultado.
                          </span>
                        ) : (
                          <span>
                            Se aplicará automáticamente el que ofrezca mejor beneficio al cliente.
                          </span>
                        )}
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Exclusividad */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Reglas de Exclusividad
              </h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exclusivoConPromociones}
                  onChange={(e) => setExclusivoConPromociones(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Exclusivo con promociones de productos
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Si está marcado, este código NO podrá usarse si el carrito contiene productos 
                    con promociones activas (como 2x1 en productos). Esto evita que se acumulen descuentos.
                  </p>
                </div>
              </label>

              {exclusivoConPromociones && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    <strong>⚠️ Atención:</strong> Este código será bloqueado automáticamente si el cliente 
                    tiene productos con promociones activas en su carrito.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validación */}
          {!esValido && codigo.trim() !== '' && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>⚠️ Atención:</strong> Debes especificar al menos un descuento porcentual o un tipo de bundle para crear el código.
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <Link
              href="/cms/tienda/promociones"
              className="flex-1 px-6 py-3 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando || !esValido}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-400 text-white rounded-lg hover:bg-green-500 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Save className="w-5 h-5" />
              {guardando ? 'Guardando...' : 'Crear Código Promocional'}
            </button>
          </div>
        </form>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(CrearCodigoPromocionalPage);
