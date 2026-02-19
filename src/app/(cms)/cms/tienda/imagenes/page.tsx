'use client';

import { useState, useEffect } from 'react';
import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { ImageIcon, Upload, Grid, List, Plus, Edit2, Trash2, Eye, EyeOff, X, AlertCircle, Check } from 'lucide-react';
import axios from '@/lib/axios';
import { logApiError, shouldSilenceError } from '@/lib/api';
import Image from 'next/image';

interface Banner {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  imagenMobile?: string;
  enlace?: string;
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

function ImagenesPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageMobile, setUploadingImageMobile] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen: '',
    imagenMobile: '',
    enlace: '',
    activo: true,
    orden: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      // Agregar timestamp para evitar caché
      const response = await axios.get(`/promotions?_=${Date.now()}`);
      console.log('📥 Banners cargados desde API:', response.data.data.length, 'banners');
      response.data.data.forEach((banner: Banner, index: number) => {
        console.log(`  ${index + 1}. "${banner.titulo}" → Enlace: ${banner.enlace || '(sin enlace)'}`);
      });
      setBanners(response.data.data || []);
    } catch (error) {
      logApiError(error, 'fetchBanners');
      if (!shouldSilenceError(error)) {
        console.error('Error al cargar banners:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, isMobile: boolean = false) => {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedFormats = ['image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowedFormats.includes(file.type)) {
      alert('Solo se permiten formatos JPEG, JPG y WEBP');
      return;
    }

    if (file.size > maxSize) {
      alert('El tamaño máximo permitido es 2MB');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      if (isMobile) {
        setUploadingImageMobile(true);
      } else {
        setUploadingImage(true);
      }

      const response = await axios.post('/uploads/banners', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrl = response.data.data.url;

      if (isMobile) {
        setFormData(prev => ({ ...prev, imagenMobile: imageUrl }));
      } else {
        setFormData(prev => ({ ...prev, imagen: imageUrl }));
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      if (isMobile) {
        setUploadingImageMobile(false);
      } else {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo || !formData.descripcion || !formData.imagen) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    console.log('📤 DATOS A ENVIAR:');
    console.log('  Título:', formData.titulo);
    console.log('  Descripción:', formData.descripcion);
    console.log('  Enlace:', formData.enlace || '(vacío)');
    console.log('  Activo:', formData.activo);
    console.log('  Orden:', formData.orden);
    console.log('  Objeto completo:', JSON.stringify(formData, null, 2));

    try {
      if (editingBanner) {
        console.log(`🔄 Actualizando banner ID: ${editingBanner.id}`);
        const response = await axios.put(`/promotions/${editingBanner.id}`, formData);
        console.log('✅ RESPUESTA DEL SERVIDOR:', JSON.stringify(response.data, null, 2));
        console.log('  Enlace guardado:', response.data.data?.enlace || '(vacío)');
        alert(`✅ Banner actualizado exitosamente\n\nEnlace configurado: ${response.data.data?.enlace || '(ninguno)'}`);
      } else {
        console.log('➕ Creando nuevo banner');
        const response = await axios.post('/promotions', formData);
        console.log('✅ RESPUESTA DEL SERVIDOR:', JSON.stringify(response.data, null, 2));
        console.log('  Enlace guardado:', response.data.data?.enlace || '(vacío)');
        alert(`✅ Banner creado exitosamente\n\nEnlace configurado: ${response.data.data?.enlace || '(ninguno)'}`);
      }
      
      await fetchBanners();
      handleCloseModal();
    } catch (error) {
      console.error('❌ Error al guardar banner:', error);
      alert('❌ Error al guardar el banner. Verifica la consola para más detalles.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;

    try {
      await axios.delete(`/promotions/${id}`);
      await fetchBanners();
    } catch (error) {
      console.error('Error al eliminar banner:', error);
      alert('Error al eliminar el banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      titulo: banner.titulo,
      descripcion: banner.descripcion,
      imagen: banner.imagen,
      imagenMobile: banner.imagenMobile || '',
      enlace: banner.enlace || '',
      activo: banner.activo,
      orden: banner.orden
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setFormData({
      titulo: '',
      descripcion: '',
      imagen: '',
      imagenMobile: '',
      enlace: '',
      activo: true,
      orden: 0
    });
  };

  const toggleActivo = async (banner: Banner) => {
    try {
      await axios.put(`/promotions/${banner.id}`, {
        ...banner,
        activo: !banner.activo
      });
      await fetchBanners();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-purple-600" />
              Imágenes de la Tienda Web
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona banners, sliders y recursos visuales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded text-gray-700 dark:text-gray-300 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded text-gray-700 dark:text-gray-300 ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Banner
            </button>
          </div>
        </div>

        {/* Información sobre formatos */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Requisitos de imágenes para el carrusel:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Formatos permitidos:</strong> JPEG, JPG, WEBP</li>
                <li><strong>Peso máximo:</strong> 2MB</li>
                <li><strong>Resolución recomendada (Desktop):</strong> 1920x600 px</li>
                <li><strong>Resolución recomendada (Mobile):</strong> 768x500 px</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lista de banners */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">Cargando banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No hay imágenes cargadas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Sube imágenes para banners, promociones y carruseles de productos
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Comenzar a Subir
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48">
                  <Image
                    src={banner.imagen}
                    alt={banner.titulo}
                    fill
                    className="object-cover"
                  />
                  {!banner.activo && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <EyeOff className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {banner.titulo}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      banner.activo 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      {banner.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {banner.descripcion}
                  </p>
                  {banner.enlace && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-3 truncate">
                      🔗 {banner.enlace}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActivo(banner)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {banner.activo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {banner.activo ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para agregar/editar banner */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="ej: ¡Nueva Colección Primavera-Verano!"
                      required
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="ej: Descubrí los nuevos modelos de la temporada"
                      required
                    />
                  </div>

                  {/* Imagen Desktop */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagen Desktop * (1920x600 px recomendado)
                    </label>
                    <div className="space-y-3">
                      {formData.imagen && (
                        <div className="relative h-32 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <Image
                            src={formData.imagen}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                        <Upload className="w-5 h-5" />
                        {uploadingImage ? 'Subiendo...' : 'Seleccionar Imagen Desktop'}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, false);
                          }}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Imagen Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagen Mobile (768x500 px recomendado, opcional)
                    </label>
                    <div className="space-y-3">
                      {formData.imagenMobile && (
                        <div className="relative h-32 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                          <Image
                            src={formData.imagenMobile}
                            alt="Preview Mobile"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors">
                        <Upload className="w-5 h-5" />
                        {uploadingImageMobile ? 'Subiendo...' : 'Seleccionar Imagen Mobile'}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, true);
                          }}
                          className="hidden"
                          disabled={uploadingImageMobile}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Enlace */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enlace del botón "Ver Más" (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.enlace}
                      onChange={(e) => setFormData({ ...formData, enlace: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="ej: /tienda o https://ejemplo.com"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Puede ser una ruta interna (/tienda) o externa (https://...)
                    </p>
                  </div>

                  {/* Orden */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Orden de visualización
                    </label>
                    <input
                      type="number"
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      min="0"
                    />
                  </div>

                  {/* Activo */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Banner activo (visible en el carrusel)
                    </label>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {editingBanner ? 'Actualizar' : 'Crear'} Banner
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(ImagenesPage);
