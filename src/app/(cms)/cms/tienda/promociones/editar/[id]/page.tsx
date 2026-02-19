'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { withCMSProtection } from '@/components/cms/withCMSProtection';

function EditarPromocionPage() {
  const router = useRouter();
  const params = useParams();
  const promocionId = params.id as string;
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [leyendaPersonalizada, setLeyendaPersonalizada] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState('PORCENTAJE');
  const [valorDescuento, setValorDescuento] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(true);
  const [destacado, setDestacado] = useState(false);

  useEffect(() => {
    cargarPromocion();
  }, [promocionId]);

  const cargarPromocion = async () => {
    try {
      setCargando(true);
      const response = await axios.get(`/cms/promociones/${promocionId}`);
      const promo = response.data;

      setTitulo(promo.titulo);
      setDescripcion(promo.descripcion);
      setLeyendaPersonalizada(promo.leyendaPersonalizada || '');
      setTipoDescuento(promo.tipoDescuento);
      // Para 2x1, valorDescuento puede ser 0 o null
      setValorDescuento(
        promo.tipoDescuento === 'DOS_POR_UNO' 
          ? '' 
          : promo.valorDescuento.toString()
      );
      setFechaInicio(new Date(promo.fechaInicio).toISOString().slice(0, 16));
      setFechaFin(new Date(promo.fechaFin).toISOString().slice(0, 16));
      setActivo(promo.activo);
      setDestacado(promo.destacado);
    } catch (error) {
      console.error('Error al cargar promoción:', error);
      alert('Error al cargar la promoción');
      router.push('/cms/tienda/promociones');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación de campos obligatorios (valorDescuento no es requerido para 2x1)
    if (!titulo || !descripcion || !tipoDescuento || !fechaInicio || !fechaFin) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar valorDescuento solo si no es 2x1
    if (tipoDescuento !== 'DOS_POR_UNO' && !valorDescuento) {
      alert('Por favor ingresa el valor del descuento');
      return;
    }

    const valor = parseFloat(valorDescuento);
    if (tipoDescuento === 'PORCENTAJE' && (valor < 1 || valor > 100)) {
      alert('El porcentaje debe estar entre 1 y 100');
      return;
    }

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      setGuardando(true);

      const data = {
        titulo,
        descripcion,
        imagenUrl: null,
        tipoDescuento,
        leyendaPersonalizada: leyendaPersonalizada.trim() || null,
        // Para 2x1, enviar 0 en lugar de valorDescuento
        valorDescuento: tipoDescuento === 'DOS_POR_UNO' 
          ? 0 
          : parseInt(valorDescuento),
        fechaInicio,
        fechaFin,
        activo,
        destacado,
        compraMinima: null,
        usosMaximos: null,
        usosPorUsuario: null,
      };

      await axios.put(`/cms/promociones/${promocionId}`, data);
      
      alert('✅ Promoción actualizada correctamente');
      router.push('/cms/tienda/promociones');
    } catch (error: any) {
      console.error('Error al actualizar promoción:', error);
      alert(error.response?.data?.error || 'Error al actualizar promoción');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Cargando promoción...</p>
          </div>
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/cms/tienda/promociones"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Editar Promoción
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Modifica los datos de la promoción
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Información Básica</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Título *</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Ej: Black Friday - 50% OFF"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Descripción *</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Describe los detalles de la promoción..."
                />
              </div>

            </div>
          </div>

          {/* Descuento */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Configuración del Descuento</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Tipo de Descuento *</label>
                <select
                  value={tipoDescuento}
                  onChange={(e) => setTipoDescuento(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="PORCENTAJE">Porcentaje</option>
                  <option value="DOS_POR_UNO">2x1</option>
                </select>
              </div>

              {tipoDescuento !== 'DOS_POR_UNO' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                    Porcentaje (1-100) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={valorDescuento}
                    onChange={(e) => setValorDescuento(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Leyenda Personalizada (Opcional)</label>
              <input
                type="text"
                value={leyendaPersonalizada}
                onChange={(e) => setLeyendaPersonalizada(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Ej: ¡Solo por hoy! Aprovechá esta oferta única"
              />
            </div>
          </div>

          {/* Vigencia */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Vigencia y Estado</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Fecha de Inicio *</label>
                  <input
                    type="datetime-local"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Fecha de Fin *</label>
                  <input
                    type="datetime-local"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t dark:border-gray-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={destacado}
                    onChange={(e) => setDestacado(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">Promoción destacada (aparecerá en el banner)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">Activa</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Link
              href="/cms/tienda/promociones"
              className="flex-1 px-6 py-3 border rounded-lg text-center hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white dark:border-gray-600"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(EditarPromocionPage);
