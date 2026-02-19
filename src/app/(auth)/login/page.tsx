'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import axios from '@/lib/axios';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email o nombre de usuario requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  recordarme: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';
  
  const { login } = useAuthStore();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecuperarModal, setShowRecuperarModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

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
      const res = await axios.post('/auth/login', data);
      const { token, user: userData } = res.data.data;
      login(userData, token);
      
      // Si es usuario CMS, redirigir a /cms; sino redirigir a returnUrl
      const cmsRoles = ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS'];
      const redirectUrl = cmsRoles.includes(userData.role) ? '/cms' : returnUrl;
      router.push(redirectUrl);
    } catch {
      setError('Email/usuario o contraseña incorrectos. Por favor, intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="text-3xl font-bold text-dark">Iniciar Sesión</h2>
          <p className="mt-2 text-gray">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-medium text-primary hover:text-primary-dark">
              Registrate acá
            </Link>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {error && (
            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email o Nombre de Usuario"
              type="text"
              placeholder="tu@email.com o usuario123"
              icon={<Mail size={20} />}
              error={errors.emailOrUsername?.message}
              {...register('emailOrUsername')}
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-[42px] text-gray hover:text-dark"
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                {...register('recordarme')}
              />
              <span className="text-sm text-gray">Recordarme (30 días)</span>
            </label>

            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => setShowRecuperarModal(true)}
                className="text-sm text-primary hover:text-primary-dark"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                type="button"
                onClick={() => setShowUsernameModal(true)}
                className="text-sm text-primary hover:text-primary-dark"
              >
                ¿Olvidaste tu nombre de usuario?
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Ingresar
          </Button>
        </form>

        {/* Info adicional */}
        <div className="text-center text-sm text-gray">
          <p>Al iniciar sesión, aceptás nuestra</p>
          <Link href="/privacidad" className="text-primary hover:underline">
            Política de Privacidad
          </Link>
        </div>

        {/* Modal Recuperar Contraseña */}
        {showRecuperarModal && <RecuperarPasswordModal onClose={() => setShowRecuperarModal(false)} />}

        {/* Modal Recuperar Username */}
        {showUsernameModal && <RecuperarUsernameModal onClose={() => setShowUsernameModal(false)} />}
      </div>
    </div>
  );
}

// Componente Modal para Recuperar Contraseña
function RecuperarPasswordModal({ onClose }: { onClose: () => void }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post('/auth/recuperar-password', { emailOrUsername });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch {
      alert('Error al enviar el correo. Por favor, intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray hover:text-dark transition-colors"
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {!showSuccess ? (
            <>
              <h3 className="text-2xl font-bold text-dark mb-2">Recuperar Contraseña</h3>
              <p className="text-gray mb-6">
                Ingresá tu nombre de usuario o correo electrónico y te enviaremos un enlace para recuperar tu cuenta.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nombre de usuario o Correo electrónico"
                  placeholder="usuario123 o tu@email.com"
                  icon={<Mail size={20} />}
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                />

                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  Recuperar Contraseña
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">¡Correo Enviado!</h3>
              <p className="text-gray">
                El correo para recuperar su cuenta ha sido enviado con éxito. Revisá tu bandeja de entrada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente Modal para Recuperar Username
function RecuperarUsernameModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post('/auth/recuperar-username', { email });
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch {
      alert('Error al enviar el correo. Por favor, intentá nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray hover:text-dark transition-colors"
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {!showSuccess ? (
            <>
              <h3 className="text-2xl font-bold text-dark mb-2">Recuperar Nombre de Usuario</h3>
              <p className="text-gray mb-6">
                Ingresá tu correo electrónico y te enviaremos tu nombre de usuario.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tu@email.com"
                  icon={<Mail size={20} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                  Recuperar Nombre de Usuario
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">¡Correo Enviado!</h3>
              <p className="text-gray">
                El correo con tu nombre de usuario ha sido enviado con éxito. Revisá tu bandeja de entrada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
