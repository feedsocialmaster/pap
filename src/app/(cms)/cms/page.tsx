'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function CMSRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Esperar a que Zustand hidrate desde localStorage
    // Usamos una estrategia más agresiva: checkear varias veces
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkAuth = () => {
      attempts++;
      console.log(`CMS Auth Check (attempt ${attempts}):`, { 
        isAuthenticated, 
        user: user?.email, 
        role: user?.role 
      });

      // Si ya tenemos datos después del primer intento, proceder
      if (attempts === 1 && !isAuthenticated) {
        // Primer check y no autenticado - esperar más
        setTimeout(checkAuth, 100);
        return;
      }

      if (!isAuthenticated || !user) {
        console.log('Sin auth, redirigiendo a CMS login');
        router.replace('/cms/login');
        return;
      }

      const cmsRoles = ['DUENA', 'DESARROLLADOR', 'GERENTE_COMERCIAL', 'ADMIN_CMS', 'VENDEDOR', 'SUPER_SU'];
      const role = user.role ?? '';
      if (!cmsRoles.includes(role)) {
        console.log('Rol no permitido:', user.role, '- redirigiendo a CMS login');
        router.replace('/cms/login');
        return;
      }

      // Acceso permitido - redirigir al inicio del CMS
      console.log('Acceso CMS permitido, redirigiendo a productos');
      router.replace('/cms/tienda/productos');
    };

    const timer = setTimeout(checkAuth, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Verificando acceso al CMS...</p>
      </div>
    </div>
  );
}
