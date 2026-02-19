'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { FileText, Save, Eye, Upload, X } from 'lucide-react';
import { useToast } from '@/store/toastStore';
import { useState } from 'react';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

function CrearBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    tituloSeo: '',
    descripcion: '',
    descripcionSeo: '',
    palabrasClave: [] as string[],
    autor: '',
    miniatura: '',
    cuerpo: '',
    estado: 'BORRADOR' as 'BORRADOR' | 'PUBLICADO'
  });

  const [palabraClave, setPalabraClave] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Archivo inválido', 'Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Archivo muy grande', 'La imagen no puede ser mayor a 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/uploads/blog', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success && response.data.data?.url) {
        setFormData(prev => ({ ...prev, miniatura: response.data.data.url }));
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      toast.error('Error', 'Error al subir la imagen. Por favor intenta de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, miniatura: '' }));
  };

  const handleSubmit = async (e: React.FormEvent, estado?: typeof formData.estado) => {
    e.preventDefault();

    // Validar que el cuerpo no esté vacío
    if (!formData.cuerpo || formData.cuerpo === '<p></p>' || formData.cuerpo.trim() === '') {
      toast.error('Error de validación', 'El cuerpo del artículo no puede estar vacío');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        estado: estado || formData.estado,
        tituloSeo: formData.tituloSeo || formData.titulo,
        descripcionSeo: formData.descripcionSeo || formData.descripcion
      };

      await axios.post('/cms/blog', dataToSend);
      toast.success('Artículo creado', estado === 'PUBLICADO' ? 'El artículo ha sido publicado exitosamente' : 'El artículo ha sido guardado como borrador');
      router.push('/cms/tienda/blog');
    } catch (error) {
      console.error('Error al crear artículo:', error);
      toast.error('Error', 'No se pudo crear el artículo. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const agregarPalabraClave = () => {
    if (palabraClave && formData.palabrasClave.length < 10) {
      setFormData(prev => ({
        ...prev,
        palabrasClave: [...prev.palabrasClave, palabraClave.trim()]
      }));
      setPalabraClave('');
    }
  };

  const eliminarPalabraClave = (index: number) => {
    setFormData(prev => ({
      ...prev,
      palabrasClave: prev.palabrasClave.filter((_, i) => i !== index)
    }));
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-600" />
              Crear Publicación
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Redacta un nuevo artículo para el blog
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Artículo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Título del artículo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Artículo SEO
                </label>
                <input
                  type="text"
                  value={formData.tituloSeo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tituloSeo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Si no se especifica, se usará el título del artículo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Descripción breve del artículo"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción SEO
                </label>
                <textarea
                  rows={2}
                  value={formData.descripcionSeo}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcionSeo: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Si no se especifica, se usará la descripción del artículo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autor del Artículo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.autor}
                  onChange={(e) => setFormData(prev => ({ ...prev, autor: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Nombre del autor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Miniatura del Artículo
                </label>
                {formData.miniatura ? (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                      <Image
                        src={formData.miniatura}
                        alt="Miniatura"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Eliminar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingImage ? (
                          <div className="text-gray-500 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <p className="text-sm">Subiendo imagen...</p>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">Click para subir</span> o arrastra y suelta
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PNG, JPG o WEBP (máx. 5MB)
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Palabras Clave (máximo 10, separadas por coma)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={palabraClave}
                    onChange={(e) => setPalabraClave(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        agregarPalabraClave();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="Escribe una palabra clave y presiona Enter"
                    disabled={formData.palabrasClave.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={agregarPalabraClave}
                    disabled={!palabraClave || formData.palabrasClave.length >= 10}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Agregar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.palabrasClave.map((palabra, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm flex items-center gap-2"
                    >
                      {palabra}
                      <button
                        type="button"
                        onClick={() => eliminarPalabraClave(index)}
                        className="hover:text-purple-900 dark:hover:text-purple-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.palabrasClave.length}/10 palabras clave
                </p>
              </div>
            </div>
          </div>

          {/* Cuerpo del Artículo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Cuerpo del Artículo</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenido *
              </label>
              <RichTextEditor
                content={formData.cuerpo}
                onChange={(html) => setFormData(prev => ({ ...prev, cuerpo: html }))}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Utiliza la barra de herramientas para formatear el contenido del artículo
              </p>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/cms/tienda/blog')}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Guardando...' : 'Guardar Borrador'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'PUBLICADO')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Eye className="w-5 h-5" />
              {loading ? 'Publicando...' : 'Publicar Artículo'}
            </button>
          </div>
        </form>
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(CrearBlogPage);
