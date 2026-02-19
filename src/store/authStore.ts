import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { syncAuthToCookies, clearAuthCookie } from '@/utils/authSync';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  syncUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: (user, token) => {
        // Limpiar carrito y wishlist del usuario anterior antes de iniciar nueva sesión
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart-storage');
          localStorage.removeItem('wishlist-storage');
        }
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        });
        // Sincronizar con cookies para el middleware
        syncAuthToCookies(true, user.id);
      },

      logout: () => {
        // Limpiar carrito y wishlist al cerrar sesión
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart-storage');
          localStorage.removeItem('wishlist-storage');
        }
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        // Limpiar cookie
        clearAuthCookie();
      },

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),

      syncUserProfile: async () => {
        const state = useAuthStore.getState();
        if (!state.isAuthenticated || !state.token) {
          console.warn('[AuthStore] syncUserProfile llamado sin autenticación');
          return;
        }

        try {
          const axios = (await import('@/lib/axios')).default;
          const response = await axios.get('/users/me');
          
          if (response.data) {
            set((currentState) => ({
              user: currentState.user ? { 
                ...currentState.user, 
                ...response.data,
                // Asegurar que fechaNacimiento se convierta a Date
                fechaNacimiento: response.data.fechaNacimiento 
                  ? new Date(response.data.fechaNacimiento) 
                  : currentState.user!.fechaNacimiento,
                fechaRegistro: response.data.fechaRegistro
                  ? new Date(response.data.fechaRegistro)
                  : currentState.user!.fechaRegistro,
              } : null
            }));
          }
        } catch (error) {
          console.error('[AuthStore] Error syncing user profile:', error);
          // Re-lanzar el error para que pueda ser manejado por el llamador
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Cuando Zustand hidrata el estado desde localStorage,
        // sincronizamos inmediatamente con las cookies
        if (state?.isAuthenticated && state?.user?.id) {
          syncAuthToCookies(true, state.user.id);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthStore] Rehydrated and synced:', { userId: state.user.id, isAuthenticated: state.isAuthenticated });
          }
        } else {
          clearAuthCookie();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthStore] Rehydrated as unauthenticated');
          }
        }
      },
    }
  )
);
