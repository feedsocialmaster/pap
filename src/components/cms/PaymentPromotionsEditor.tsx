'use client';

import { useState, useEffect, useRef } from 'react';
import axios from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/toastStore';
import { Save, Plus, Trash2, Image as ImageIcon, Calendar, Building2, X } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

interface PaymentPromotion {
  id: string;
  bankName: string;
  imageUrl: string;
  promotionText: string;
  validFrom: string;
  validUntil: string;
}

interface PaymentPromotionsEditorProps {
  contentKey: string;
  title: string;
  publicUrl?: string;
}

export default function PaymentPromotionsEditor({
  contentKey,
  title,
  publicUrl,
}: PaymentPromotionsEditorProps) {
  const { user, token } = useAuthStore();
  const toast = useToast();

  const [promotions, setPromotions] = useState<PaymentPromotion[]>([]);
  const [originalPromotions, setOriginalPromotions] = useState<PaymentPromotion[]>([]);
  const [version, setVersion] = useState(0);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [editingPromotion, setEditingPromotion] = useState<PaymentPromotion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Cargar contenido inicial
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/cms/site-content/${contentKey}`);
        
        if (response.data.success && response.data.content) {
          const data = response.data.content;
          const parsedPromotions: PaymentPromotion[] = JSON.parse(data.content || '[]');
          
          setPromotions(parsedPromotions);
          setOriginalPromotions(parsedPromotions);
          setVersion(data.version);
          setPublished(data.published);
          setLastSaved(data.updatedAt ? new Date(data.updatedAt) : null);
        } else {
          setPromotions([]);
          setOriginalPromotions([]);
        }
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Error al cargar promociones:', error);
          toast.error('Error', 'No se pudo cargar el contenido');
        }
      } finally {
        setLoading(false);
      }
    };

    const connectWebSocket = () => {
      const socket = io('http://localhost:4000', {
        path: '/ws',
        transports: ['websocket'],
        auth: { token },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('site-content:join', { key: contentKey, locale: 'es-AR' });
      });

      socket.on('site-content.updated', (data: any) => {
        if (data.key === contentKey && data.updatedBy !== user?.id) {
          toast.info('Contenido actualizado', `${data.updatedByName || 'Otro usuario'} actualizó este contenido`);
          loadContent();
        }
      });
    };

    const disconnectWebSocket = () => {
      if (socketRef.current) {
        socketRef.current.emit('site-content:leave', { key: contentKey, locale: 'es-AR' });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    loadContent();
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);

  // Detectar cambios
  useEffect(() => {
    const changed = JSON.stringify(promotions) !== JSON.stringify(originalPromotions);
    setHasChanges(changed);
  }, [promotions, originalPromotions]);

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const response = await axios.post(`/cms/site-content/${contentKey}`, {
        content: JSON.stringify(promotions),
        title,
        version,
        locale: 'es-AR',
        published,
      });

      if (response.data.success) {
        const newVersion = response.data.newVersion;
        setVersion(newVersion);
        setOriginalPromotions([...promotions]);
        setHasChanges(false);
        setLastSaved(new Date());

        toast.success('Guardado', `Promociones guardadas (v${newVersion})`);
      }
    } catch (error: any) {
      console.error('Error al guardar:', error);
      toast.error('Error', error.response?.data?.error || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPromotion = () => {
    setEditingPromotion({
      id: `promo-${Date.now()}`,
      bankName: '',
      imageUrl: '',
      promotionText: '',
      validFrom: '',
      validUntil: '',
    });
    setShowModal(true);
  };

  const handleEditPromotion = (promo: PaymentPromotion) => {
    setEditingPromotion({ ...promo });
    setShowModal(true);
  };

  const handleDeletePromotion = (id: string) => {
    if (confirm('¿Eliminar esta promoción?')) {
      setPromotions(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSavePromotion = () => {
    if (!editingPromotion) return;

    if (!editingPromotion.bankName.trim()) {
      toast.warning('Validación', 'El nombre del banco es requerido');
      return;
    }

    if (!editingPromotion.promotionText.trim()) {
      toast.warning('Validación', 'El texto de la promoción es requerido');
      return;
    }

    const exists = promotions.find(p => p.id === editingPromotion.id);
    
    if (exists) {
      setPromotions(prev => prev.map(p => p.id === editingPromotion.id ? editingPromotion : p));
    } else {
      setPromotions(prev => [...prev, editingPromotion]);
    }

    setShowModal(false);
    setEditingPromotion(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPromotion) return;

    // Validar formato
    const formatosPermitidos = ['image/jpeg', 'image/jpg', 'image/webp'];
    if (!formatosPermitidos.includes(file.type)) {
      toast.error('Error', 'Solo se permiten imágenes en formato JPG, JPEG o WEBP');
      return;
    }

    // Validar tamaño (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Error', 'La imagen no debe superar los 2MB');
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/uploads/banners', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setEditingPromotion({ 
          ...editingPromotion, 
          imageUrl: response.data.data.url 
        });
        toast.success('Éxito', 'Imagen subida correctamente');
      }
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      toast.error('Error', error.response?.data?.error || 'No se pudo subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    if (!editingPromotion) return;
    setEditingPromotion({ ...editingPromotion, imageUrl: '' });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPromotions = [...promotions];
    [newPromotions[index - 1], newPromotions[index]] = [newPromotions[index], newPromotions[index - 1]];
    setPromotions(newPromotions);
  };

  const handleMoveDown = (index: number) => {
    if (index === promotions.length - 1) return;
    const newPromotions = [...promotions];
    [newPromotions[index], newPromotions[index + 1]] = [newPromotions[index + 1], newPromotions[index]];
    setPromotions(newPromotions);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona las promociones bancarias que se mostrarán en la página principal
          </p>
          {publicUrl && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Página pública: <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{publicUrl}</a>
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {published ? '✅ Publicado' : '⚠️ Sin publicar'} • Versión: {version}
            {lastSaved && ` • Guardado: ${lastSaved.toLocaleString()}`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              hasChanges && !saving
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Checkbox Publicar */}
      <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="w-5 h-5 text-primary focus:ring-primary"
        />
        <label htmlFor="published" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
          Publicado (visible en la página pública)
        </label>
      </div>

      {/* Lista de promociones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Promociones ({promotions.length})
          </h2>
          <button
            onClick={handleAddPromotion}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Promoción
          </button>
        </div>

        {promotions.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No hay promociones agregadas</p>
            <p className="text-sm mt-2">Haz clic en "Agregar Promoción" para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map((promo, index) => (
              <div
                key={promo.id}
                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Imagen preview */}
                <div className="flex-shrink-0">
                  {promo.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={promo.imageUrl}
                      alt={promo.bankName}
                      className="w-48 h-32 object-contain rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  ) : (
                    <div className="w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{promo.bankName}</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">{promo.promotionText}</p>
                  {(promo.validFrom || promo.validUntil) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {promo.validFrom && `Desde: ${new Date(promo.validFrom).toLocaleDateString()}`}
                      {promo.validFrom && promo.validUntil && ' • '}
                      {promo.validUntil && `Hasta: ${new Date(promo.validUntil).toLocaleDateString()}`}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                    title="Mover arriba"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === promotions.length - 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                    title="Mover abajo"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleEditPromotion(promo)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeletePromotion(promo.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {showModal && editingPromotion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {promotions.find(p => p.id === editingPromotion.id) ? 'Editar' : 'Nueva'} Promoción
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPromotion(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nombre del banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Nombre del Banco *
                </label>
                <input
                  type="text"
                  value={editingPromotion.bankName}
                  onChange={(e) => setEditingPromotion({ ...editingPromotion, bankName: e.target.value })}
                  placeholder="Ej: Banco Nación"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* URL de imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Subir Imagen (opcional)
                </label>
                
                {/* Si ya hay una imagen, mostrar preview y botón para eliminar */}
                {editingPromotion.imageUrl ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editingPromotion.imageUrl}
                        alt="Preview"
                        className="max-w-md w-full h-auto rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        title="Eliminar imagen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Haz clic en la X para eliminar y subir otra imagen
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/webp"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {uploadingImage && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Subiendo imagen...
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Formatos permitidos: JPG, JPEG, WEBP. Tamaño máximo: 2MB
                    </p>
                  </div>
                )}
              </div>

              {/* Texto de la promoción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Texto de la Promoción *
                </label>
                <textarea
                  value={editingPromotion.promotionText}
                  onChange={(e) => setEditingPromotion({ ...editingPromotion, promotionText: e.target.value })}
                  placeholder="Ej: 12 cuotas sin interés con todas las tarjetas Visa y Mastercard"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              {/* Fechas de vigencia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Válido Desde
                  </label>
                  <input
                    type="date"
                    value={editingPromotion.validFrom}
                    onChange={(e) => setEditingPromotion({ ...editingPromotion, validFrom: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Válido Hasta
                  </label>
                  <input
                    type="date"
                    value={editingPromotion.validUntil}
                    onChange={(e) => setEditingPromotion({ ...editingPromotion, validUntil: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPromotion(null);
                }}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePromotion}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Guardar Promoción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
