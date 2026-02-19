'use client';

import { useState, useRef } from 'react';
import { FileText, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from '@/lib/axios';
import { serverBaseUrl } from '@/lib/api';

interface InvoiceUploadProps {
  orderId: string;
  currentInvoiceUrl: string | null | undefined;
  onInvoiceChange: (newUrl: string | null) => void;
}

export function InvoiceUpload({ orderId, currentInvoiceUrl, onInvoiceChange }: InvoiceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar los 10MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Primero subir el archivo
      const formData = new FormData();
      formData.append('factura', file);

      const uploadResponse = await axios.post('/uploads/facturas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!uploadResponse.data.success) {
        throw new Error('Error al subir el archivo');
      }

      const facturaUrl = uploadResponse.data.data.url;

      // Luego asociar la URL a la orden
      const associateResponse = await axios.post(`/cms/pedidos/${orderId}/factura`, {
        facturaUrl,
      });

      if (associateResponse.data.success) {
        onInvoiceChange(facturaUrl);
      }
    } catch (err: any) {
      console.error('Error al subir factura:', err);
      setError(err.response?.data?.error || 'Error al subir la factura');
    } finally {
      setUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentInvoiceUrl) return;

    const confirmed = window.confirm('¿Estás seguro de eliminar esta factura?');
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await axios.delete(`/cms/pedidos/${orderId}/factura`);

      if (response.data.success) {
        onInvoiceChange(null);
      }
    } catch (err: any) {
      console.error('Error al eliminar factura:', err);
      setError(err.response?.data?.error || 'Error al eliminar la factura');
    } finally {
      setDeleting(false);
    }
  };

  const getFilenameFromUrl = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'factura.pdf';
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      <h4 className="font-semibold text-purple-700 dark:text-white mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Factura PDF
      </h4>

      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
        </div>
      )}

      {currentInvoiceUrl ? (
        // Factura ya subida
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {getFilenameFromUrl(currentInvoiceUrl)}
              </p>
              <a
                href={`${serverBaseUrl}${currentInvoiceUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:underline"
              >
                Ver factura
              </a>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            title="Eliminar factura"
          >
            {deleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>
      ) : (
        // No hay factura - mostrar botón de subida
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id={`invoice-upload-${orderId}`}
          />
          <label
            htmlFor={`invoice-upload-${orderId}`}
            className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploading
                ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                <span className="text-sm text-purple-600">Subiendo factura...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Haz clic para subir factura PDF
                </span>
                <span className="text-xs text-gray-400 mt-1">Máximo 10MB</span>
              </div>
            )}
          </label>
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        La factura estará disponible para el cliente cuando confirme la recepción del producto.
      </p>
    </div>
  );
}
