'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import axios from '@/lib/axios';
import { cn } from '@/utils/format';

interface ImageUploadFieldProps {
  /** URL de la imagen actual */
  value?: string;
  /** Callback cuando cambia la imagen */
  onChange: (url: string | undefined) => void;
  /** Label del campo */
  label?: string;
  /** Descripción del campo */
  description?: string;
  /** Tamaño máximo en MB (default: 2) */
  maxSizeMB?: number;
  /** Formatos permitidos */
  allowedFormats?: string[];
  /** Aspecto ratio sugerido (opcional) */
  aspectRatio?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Deshabilitar campo */
  disabled?: boolean;
  /** Endpoint de upload (default: '/uploads/banners') */
  uploadEndpoint?: string;
}

export function ImageUploadField({
  value,
  onChange,
  label,
  description,
  maxSizeMB = 2,
  allowedFormats = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'],
  aspectRatio,
  className,
  disabled = false,
  uploadEndpoint = '/uploads/banners',
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar formato
    if (!allowedFormats.includes(file.type)) {
      alert(`Solo se permiten formatos: ${allowedFormats.map(f => f.replace('image/', '')).join(', ').toUpperCase()}`);
      return;
    }

    // Validar tamaño
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`El tamaño máximo permitido es ${maxSizeMB}MB`);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);

      const response = await axios.post(uploadEndpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = response.data.data.url;
      onChange(imageUrl);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen. Intenta nuevamente.');
    } finally {
      setUploading(false);
      // Limpiar input para permitir subir la misma imagen otra vez
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      {aspectRatio && (
        <p className="text-xs text-gray-500">
          <span className="font-medium">Aspecto sugerido:</span> {aspectRatio}
        </p>
      )}

      <div className="space-y-3">
        {/* Vista previa de imagen */}
        {value && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className="max-w-full max-h-48 rounded-lg border-2 border-gray-200 object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eliminar imagen"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Botón de carga */}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={allowedFormats.join(',')}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
            id={`image-upload-${label || 'field'}`}
          />
          
          <label
            htmlFor={`image-upload-${label || 'field'}`}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
              uploading || disabled
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : 'border-primary-light bg-white hover:border-primary hover:bg-primary/5',
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin text-primary" size={20} />
                <span className="text-sm font-medium text-gray-600">Subiendo...</span>
              </>
            ) : (
              <>
                {value ? <ImageIcon className="text-primary" size={20} /> : <Upload className="text-primary" size={20} />}
                <span className="text-sm font-medium text-gray-700">
                  {value ? 'Cambiar imagen' : 'Subir imagen'}
                </span>
              </>
            )}
          </label>
          
          <p className="text-xs text-gray-500 mt-1">
            Máx. {maxSizeMB}MB • {allowedFormats.map(f => f.replace('image/', '')).join(', ').toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
