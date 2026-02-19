'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { syncAuthToCookies, clearAuthCookie } from '@/utils/authSync';

/**
 * AuthProvider - Componente que garantiza la sincronización del estado de autenticación
 * 
 * Este componente:
 * 1. Espera a que Zustand hidrate el estado desde localStorage
 * 2. Sincroniza automáticamente el estado con las cookies en cada carga
 * 3. Previene el flash de contenido no autenticado (FOUC)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  
  // Efecto inicial para marcar como hidratado
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Efecto separado para sincronizar cookies cada vez que cambia el estado
  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated && user?.id) {
      syncAuthToCookies(true, user.id);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider] Synced auth to cookies:', { userId: user.id, isAuthenticated });
      }
    } else {
      clearAuthCookie();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthProvider] Cleared auth cookies');
      }
    }
  }, [isHydrated, isAuthenticated, user]);

  return <>{children}</>;
}
