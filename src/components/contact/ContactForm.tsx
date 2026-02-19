'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiBaseUrl } from '@/lib/api';

interface FormState {
  nombre: string;
  email: string;
  telefono: string;
  asunto: string;
  mensaje: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  telefono?: string;
  asunto?: string;
  mensaje?: string;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const ASUNTOS = [
  'Consulta sobre un producto',
  'Consulta sobre un pedido',
  'Cambios y devoluciones',
  'Información de sucursales',
  'Sugerencias o reclamos',
  'Otro',
];

const initialForm: FormState = {
  nombre: '',
  email: '',
  telefono: '',
  asunto: '',
  mensaje: '',
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [serverMessage, setServerMessage] = useState('');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.nombre.trim() || form.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres.';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Ingresá un email válido.';
    }
    if (!form.telefono.trim() || form.telefono.replace(/\D/g, '').length < 10) {
      newErrors.telefono = 'Ingresá un teléfono válido (mínimo 10 dígitos).';
    }
    if (!form.asunto.trim() || form.asunto.trim().length < 5) {
      newErrors.asunto = 'Seleccioná o escribí un asunto.';
    }
    if (!form.mensaje.trim() || form.mensaje.trim().length < 20) {
      newErrors.mensaje = 'El mensaje debe tener al menos 20 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo al editar
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('loading');
    setServerMessage('');

    try {
      const response = await fetch(`${apiBaseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setServerMessage(data.message || '¡Mensaje enviado con éxito! Te responderemos pronto.');
        setForm(initialForm);
      } else {
        setStatus('error');
        // Si hay errores de validación del servidor, mostrarlos por campo
        if (data.errors && Array.isArray(data.errors)) {
          const serverErrors: FormErrors = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            serverErrors[err.field as keyof FormErrors] = err.message;
          });
          setErrors(serverErrors);
        }
        setServerMessage(data.message || 'Error al enviar el mensaje. Por favor, intentá nuevamente.');
      }
    } catch {
      setStatus('error');
      setServerMessage('No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setServerMessage('');
    setErrors({});
  };

  // --- Estado de éxito ---
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <CheckCircle size={44} className="text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-dark">¡Mensaje enviado!</h3>
        <p className="text-gray max-w-md leading-relaxed">{serverMessage}</p>
        <button
          onClick={handleReset}
          className="mt-4 btn-primary"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  // --- Formulario ---
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* Nombre y Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold text-dark mb-1.5">
            Nombre y apellido <span className="text-primary">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej: María García"
            autoComplete="name"
            className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-primary/30 ${
              errors.nombre
                ? 'border-red-400 bg-red-50 focus:border-red-400'
                : 'border-gray-200 bg-white focus:border-primary'
            }`}
          />
          {errors.nombre && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.nombre}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-dark mb-1.5">
            Email <span className="text-primary">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Ej: maria@ejemplo.com"
            autoComplete="email"
            className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-primary/30 ${
              errors.email
                ? 'border-red-400 bg-red-50 focus:border-red-400'
                : 'border-gray-200 bg-white focus:border-primary'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Teléfono y Asunto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="telefono" className="block text-sm font-semibold text-dark mb-1.5">
            Teléfono <span className="text-primary">*</span>
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            value={form.telefono}
            onChange={handleChange}
            placeholder="Ej: +54 9 261 254-6976"
            autoComplete="tel"
            className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-primary/30 ${
              errors.telefono
                ? 'border-red-400 bg-red-50 focus:border-red-400'
                : 'border-gray-200 bg-white focus:border-primary'
            }`}
          />
          {errors.telefono && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.telefono}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="asunto" className="block text-sm font-semibold text-dark mb-1.5">
            Asunto <span className="text-primary">*</span>
          </label>
          <select
            id="asunto"
            name="asunto"
            value={form.asunto}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-primary/30 bg-white ${
              errors.asunto
                ? 'border-red-400 bg-red-50 focus:border-red-400 text-red-500'
                : form.asunto
                ? 'border-gray-200 text-dark focus:border-primary'
                : 'border-gray-200 text-gray-400 focus:border-primary'
            }`}
          >
            <option value="" disabled>Seleccioná un asunto...</option>
            {ASUNTOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {errors.asunto && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.asunto}
            </p>
          )}
        </div>
      </div>

      {/* Mensaje */}
      <div>
        <label htmlFor="mensaje" className="block text-sm font-semibold text-dark mb-1.5">
          Mensaje <span className="text-primary">*</span>
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={5}
          value={form.mensaje}
          onChange={handleChange}
          placeholder="Contanos en qué podemos ayudarte..."
          className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-primary/30 resize-none ${
            errors.mensaje
              ? 'border-red-400 bg-red-50 focus:border-red-400'
              : 'border-gray-200 bg-white focus:border-primary'
          }`}
        />
        <div className="flex justify-between items-start mt-1.5">
          {errors.mensaje ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.mensaje}
            </p>
          ) : (
            <span />
          )}
          <span className={`text-xs ml-auto ${form.mensaje.length < 20 ? 'text-gray-400' : 'text-green-600'}`}>
            {form.mensaje.length} / 5000
          </span>
        </div>
      </div>

      {/* Error global del servidor */}
      {status === 'error' && serverMessage && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <p>{serverMessage}</p>
        </div>
      )}

      {/* Botón de envío */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs text-gray-400">
          <span className="text-primary">*</span> Campos obligatorios. Respondemos dentro de las próximas 24 hs hábiles.
        </p>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary flex items-center gap-2 min-w-[180px] justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send size={18} />
              Enviar mensaje
            </>
          )}
        </button>
      </div>
    </form>
  );
}
