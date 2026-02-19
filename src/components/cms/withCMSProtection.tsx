'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function withCMSProtection<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user } = useAuthStore();
    const [isHydrated, setIsHydrated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
      // Marcar como hidratado una vez que el componente se monta
      setIsHydrated(true);
    }, []);

    useEffect(() => {
      if (!isHydrated) return;

      // Pequeño delay para asegurar que Zustand ha cargado del storage
      const timer = setTimeout(() => {
        // Verificar si el usuario está autenticado
        if (!isAuthenticated || !user) {
          console.log('No autenticado, redirigiendo a CMS login');
          router.replace('/cms/login');
          return;
        }

        // Verificar que el usuario tiene un rol válido para el CMS
        const cmsRoles = ['VENDEDOR', 'ADMIN_CMS', 'GERENTE_COMERCIAL', 'DESARROLLADOR', 'DUENA', 'SUPER_SU'];
        const role = user.role ?? '';
        if (!cmsRoles.includes(role)) {
          console.log('Rol no válido para CMS, redirigiendo a CMS login');
          router.replace('/cms/login');
          return;
        }

        // Todo bien, usuario autenticado y con rol válido
        setIsChecking(false);
      }, 50);

      return () => clearTimeout(timer);
    }, [isHydrated, isAuthenticated, user, router]);

    // Mostrar loading mientras se verifica
    if (!isHydrated || isChecking) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Verificando acceso...</p>
          </div>
        </div>
      );
    }

    // Usuario autenticado y autorizado, renderizar componente
    return <Component {...props} />;
  };
}
