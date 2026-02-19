'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import axios from '@/lib/axios';
import ToastContainer from '@/components/ui/Toast';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email o usuario requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function CMSLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addToast } = useToastStore();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for logout success message
  useEffect(() => {
    const logoutSuccess = sessionStorage.getItem('cms_logout_success');
    if (logoutSuccess) {
      sessionStorage.removeItem('cms_logout_success');
      addToast({
        type: 'success',
        title: 'Sesión cerrada',
        message: 'Has cerrado sesión correctamente',
      });
    }
  }, [addToast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('📤 Enviando datos de login CMS:', { 
        emailOrUsername: data.emailOrUsername, 
        passwordLength: data.password.length
      });
      
      const res = await axios.post('/auth/login', data);
      const { token, user: userData } = res.data.data;

      // Verificar que el usuario tiene un rol de CMS
      const cmsRoles = ['VENDEDOR', 'ADMIN_CMS', 'GERENTE_COMERCIAL', 'DESARROLLADOR', 'DUENA', 'SUPER_SU'];
      if (!cmsRoles.includes(userData.role)) {
        setError('No tenés permisos para acceder al CMS. Esta área es solo para personal autorizado.');
        return;
      }

      // Login exitoso
      login(userData, token);
      
      // Store success message for display after navigation
      sessionStorage.setItem('cms_login_success', 'true');
      
      router.push('/cms/tienda/productos');
    } catch (err: any) {
      console.error('Login error FULL:', JSON.stringify(err, null, 2));
      console.error('Login error:', err);
      console.error('Error response:', err?.response);
      console.error('Error response data:', err?.response?.data);
      console.error('Error status:', err?.response?.status);
      console.error('Error config:', err?.config);
      
      const errorMessage = err?.response?.data?.error || 'Email o contraseña incorrectos. Por favor, intentá nuevamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-primary-dark rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            CMS Paso a Paso
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Panel de Administración
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-xs md:text-sm flex items-start gap-2">
                <span className="text-base md:text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email/Username Input */}
            <div>
              <label htmlFor="emailOrUsername" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email o Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  className={`block w-full pl-10 pr-3 py-3 text-sm border ${
                    errors.emailOrUsername
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors`}
                  placeholder="tu@pasoapaso.com o usuario"
                  {...register('emailOrUsername')}
                />
              </div>
              {errors.emailOrUsername && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.emailOrUsername.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`block w-full pl-10 pr-12 py-3 text-sm border ${
                    errors.password
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 md:py-3.5 px-4 border border-transparent rounded-xl shadow-xl text-white bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary font-semibold text-sm md:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verificando acceso...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Acceder al CMS</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to Site Link */}
        <div className="mt-4 md:mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm md:text-base text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary font-semibold transition-all hover:gap-3 group"
          >
            <span className="text-lg md:text-xl group-hover:scale-110 transition-transform">←</span>
            <span>Volver a la Tienda Web</span>
          </Link>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
