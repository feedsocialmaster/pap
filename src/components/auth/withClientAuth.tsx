'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * HOC para proteger rutas del lado del cliente
 * 
 * Este componente:
 * 1. Espera a que Zustand complete la hidratación desde localStorage
 * 2. Verifica el estado de autenticación
 * 3. Redirige a /login si el usuario no está autenticado
 * 4. Muestra un loading durante la verificación para evitar flash
 * 
 * USO:
 * export default withClientAuth(MiPagina);
 */
export function withClientAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    loadingComponent?: React.ReactNode;
  }
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      // Esperar un tick para asegurar que Zustand haya hidratado
      const timer = setTimeout(() => {
        setIsChecking(false);

        if (!isAuthenticated) {
          const currentPath = window.location.pathname;
          const redirectPath = options?.redirectTo || '/login';
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[withClientAuth] Usuario no autenticado, redirigiendo a:', redirectPath);
          }
          
          router.push(`${redirectPath}?returnUrl=${encodeURIComponent(currentPath)}`);
        }
      }, 100); // 100ms para permitir hidratación

      return () => clearTimeout(timer);
    }, [isAuthenticated, router]);

    // Mostrar loading mientras se verifica la autenticación
    if (isChecking) {
      return options?.loadingComponent || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <p className="text-gray">Verificando sesión...</p>
          </div>
        </div>
      );
    }

    // Si no está autenticado, no renderizar nada (ya se redirigió)
    if (!isAuthenticated) {
      return null;
    }

    // Usuario autenticado, renderizar el componente
    return <Component {...props} />;
  };
}
