'use client';

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';
import axios from '@/lib/axios';

interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
  mediaType: 'image' | 'video';
}

export function UploadMediaModal({ isOpen, onClose, onUploadComplete, mediaType }: UploadMediaModalProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const acceptedTypes = mediaType === 'image' 
    ? 'image/jpeg,image/png,image/webp,image/gif'
    : 'video/mp4,video/webm,video/ogg';

  const maxSize = mediaType === 'image' ? 5 : 50; // MB
  const maxSizeBytes = maxSize * 1024 * 1024;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (mediaType === 'image' && !file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (mediaType === 'video' && !file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video válido');
      return;
    }

    // Validar tamaño
    if (file.size > maxSizeBytes) {
      alert(`El archivo no puede ser mayor a ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append(mediaType === 'image' ? 'image' : 'video', selectedFile);

      const endpoint = mediaType === 'image' ? '/uploads/blog' : '/uploads/blog-video';
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success && response.data.data?.url) {
        onUploadComplete(response.data.data.url);
        handleClose();
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert('Error al subir el archivo. Por favor intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setSelectedFile(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const Icon = mediaType === 'image' ? ImageIcon : Video;
  const title = mediaType === 'image' ? 'Subir Imagen' : 'Subir Video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon className="w-6 h-6 text-purple-600" />
            {title}
          </h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedFile ? (
            <div>
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-16 h-16 mb-4 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click para seleccionar</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {mediaType === 'image' 
                      ? 'PNG, JPG, WEBP o GIF (máx. 5MB)'
                      : 'MP4, WEBM o OGG (máx. 50MB)'}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={acceptedTypes}
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                {mediaType === 'image' ? (
                  <img
                    src={preview || ''}
                    alt="Preview"
                    className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-900"
                  />
                ) : (
                  <video
                    src={preview || ''}
                    className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-900"
                    controls
                  />
                )}
              </div>

              {/* File info */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Archivo:</strong> {selectedFile.name}</p>
                <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cambiar archivo
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Subir {mediaType === 'image' ? 'Imagen' : 'Video'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {mediaType === 'image' 
              ? 'Las imágenes se optimizarán automáticamente para web'
              : 'Los videos se almacenarán en su formato original'}
          </p>
        </div>
      </div>
    </div>
  );
}
