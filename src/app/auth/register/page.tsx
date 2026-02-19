'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, Calendar, Phone } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { isValidAge, isStrongPassword } from '@/utils/format';
import axios from '@/lib/axios';

const registerSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  fechaNacimiento: z.string().refine((date) => {
    return isValidAge(new Date(date));
  }, 'Debes tener entre 18 y 55 años'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres').max(20, 'Máximo 20 caracteres').regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  password: z.string().refine((password) => {
    return isStrongPassword(password).isValid;
  }, 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo'),
  confirmarPassword: z.string(),
  aceptaTerminos: z.boolean().refine((val) => val === true, 'Debes aceptar los términos'),
  suscribirBoletin: z.boolean().optional(),
}).refine((data) => data.password === data.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmarPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');
  const passwordStrength = password ? isStrongPassword(password) : { isValid: false, errors: [] };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const response = await axios.post('/auth/register', {
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellido: data.apellido,
        username: data.username,
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono || undefined,
        suscribirBoletin: data.suscribirBoletin || false,
      });
      
      if (response.data.success) {
        alert('¡Registro exitoso! Ahora podés iniciar sesión.');
        router.push('/login');
      } else {
        alert(response.data.error || 'Error al registrarse. Por favor, intentá nuevamente.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al registrarse. Por favor, intentá nuevamente.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="text-3xl font-bold text-dark">Crear Cuenta</h2>
          <p className="mt-2 text-gray">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              Iniciá sesión
            </Link>
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-xl shadow-card p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-dark flex items-center gap-2">
              <User className="text-primary" size={24} />
              Datos Personales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                placeholder="María"
                error={errors.nombre?.message}
                {...register('nombre')}
              />
              <Input
                label="Apellido"
                placeholder="González"
                error={errors.apellido?.message}
                {...register('apellido')}
              />
            </div>

            <Input
              label="Fecha de Nacimiento"
              type="date"
              icon={<Calendar size={20} />}
              error={errors.fechaNacimiento?.message}
              {...register('fechaNacimiento')}
            />

            <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
              <p className="text-sm text-dark">
                <strong>Importante:</strong> Solo podés registrarte si tenés entre 18 y 55 años.
              </p>
            </div>

            <Input
              label="Teléfono Celular"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              icon={<Phone size={20} />}
              error={errors.telefono?.message}
              helperText="Sólo para coordinar envíos, no lo usaremos para enviarte propaganda"
              {...register('telefono')}
            />

            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="tu@email.com"
              icon={<Mail size={20} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Creá tu nombre de usuario"
              placeholder="usuario123"
              icon={<User size={20} />}
              error={errors.username?.message}
              {...register('username')}
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

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.isValid
                          ? 'bg-success w-full'
                          : 'bg-warning w-1/2'
                      }`}
                    />
                  </div>
                  <span className={`text-sm font-medium ${passwordStrength.isValid ? 'text-success' : 'text-warning'}`}>
                    {passwordStrength.isValid ? 'Fuerte' : 'Débil'}
                  </span>
                </div>
                {!passwordStrength.isValid && (
                  <ul className="text-xs text-gray space-y-1">
                    {passwordStrength.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="relative">
              <Input
                label="Confirmar Contraseña"
                type={mostrarConfirmarPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                error={errors.confirmarPassword?.message}
                {...register('confirmarPassword')}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                className="absolute right-3 top-[42px] text-gray hover:text-dark"
              >
                {mostrarConfirmarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Checkboxes Obligatorios */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-1 text-primary border-gray-300 rounded focus:ring-primary accent-primary"
                  {...register('aceptaTerminos')}
                />
                <span className="text-sm text-gray">
                  Acepto los{' '}
                  <Link href="/privacidad" className="text-primary hover:underline">
                    Términos y Política de Privacidad
                  </Link>
                </span>
              </label>
              {errors.aceptaTerminos && (
                <p className="text-sm text-error ml-6">{errors.aceptaTerminos.message}</p>
              )}
            </div>


            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              Crear Cuenta
            </Button>
          </div>
        </form>

        {/* Beneficios de registrarse */}
        <div className="mt-8 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-dark mb-4">Beneficios de ser parte de Paso a Paso</h3>
          <ul className="space-y-2 text-sm text-gray">
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              Acceso anticipado a nuevas colecciones
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✓</span>
              Seguimiento de tus pedidos en tiempo real
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
