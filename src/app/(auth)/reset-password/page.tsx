'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import axios from '@/lib/axios';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificar token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        setTokenValid(false);
        return;
      }

      try {
        const response = await axios.post('/auth/verify-reset-token', { token });
        setTokenValid(response.data.data.valid);
      } catch {
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);

    try {
      await axios.post('/auth/reset-password', { token, password });
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña. Por favor, intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading mientras verifica el token
  if (isVerifying) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Token inválido o expirado
  if (!tokenValid) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-error" />
          </div>
          <h2 className="text-2xl font-bold text-dark mb-4">Enlace Inválido o Expirado</h2>
          <p className="text-gray mb-6">
            El enlace para restablecer tu contraseña ha expirado o no es válido. 
            Por favor, solicitá uno nuevo.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg">
              Volver a Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Éxito
  if (success) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-dark mb-4">¡Contraseña Actualizada!</h2>
          <p className="text-gray mb-6">
            Tu contraseña ha sido cambiada exitosamente. 
            Serás redirigido a la página de inicio de sesión...
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg">
              Iniciar Sesión Ahora
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-dark">Nueva Contraseña</h2>
          <p className="mt-2 text-gray">
            Ingresá tu nueva contraseña para restablecer tu cuenta.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Nueva Contraseña"
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                icon={<Lock size={20} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-[42px] text-gray hover:text-dark"
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar Contraseña"
                type={mostrarConfirmPassword ? 'text' : 'password'}
                placeholder="Repetí tu nueva contraseña"
                icon={<Lock size={20} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmPassword(!mostrarConfirmPassword)}
                className="absolute right-3 top-[42px] text-gray hover:text-dark"
              >
                {mostrarConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Indicador de fortaleza */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-1">
                <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-success' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-success' : 'bg-gray-200'}`}></div>
                <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(password) && /\d/.test(password) ? 'bg-success' : 'bg-gray-200'}`}></div>
              </div>
              <ul className="text-xs text-gray space-y-1">
                <li className={password.length >= 6 ? 'text-success' : ''}>
                  {password.length >= 6 ? '✓' : '○'} Mínimo 6 caracteres
                </li>
                <li className={password.length >= 8 ? 'text-success' : ''}>
                  {password.length >= 8 ? '✓' : '○'} 8+ caracteres (recomendado)
                </li>
                <li className={/[A-Z]/.test(password) && /\d/.test(password) ? 'text-success' : ''}>
                  {/[A-Z]/.test(password) && /\d/.test(password) ? '✓' : '○'} Mayúscula y número
                </li>
              </ul>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Cambiar Contraseña
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-primary hover:text-primary-dark">
              ← Volver a Iniciar Sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
