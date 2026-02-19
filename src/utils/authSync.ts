/**
 * Utilidades para sincronizar el estado de autenticación con cookies
 * Esto permite que el middleware del servidor pueda verificar la autenticación
 */

const AUTH_COOKIE_NAME = 'user-auth';

/**
 * Sincroniza el estado de autenticación con cookies
 * Debe llamarse cada vez que cambia el estado de autenticación
 */
export function syncAuthToCookies(isAuthenticated: boolean, userId?: string) {
  if (typeof window === 'undefined') return;

  const authData = {
    state: {
      isAuthenticated,
      userId,
    },
  };

  // Guardar en cookie (30 días de expiración)
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  // Añadir Secure flag en HTTPS (producción)
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  document.cookie = `${AUTH_COOKIE_NAME}=${JSON.stringify(authData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secureFlag}`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[authSync] Cookie set:', { isAuthenticated, userId, cookieName: AUTH_COOKIE_NAME });
  }
}

/**
 * Elimina la cookie de autenticación
 */
export function clearAuthCookie() {
  if (typeof window === 'undefined') return;

  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[authSync] Cookie cleared:', { cookieName: AUTH_COOKIE_NAME });
  }
}

/**
 * Hook personalizado para sincronizar automáticamente el estado con cookies
 */
export function useAuthSync() {
  if (typeof window === 'undefined') return;

  // Escuchar cambios en localStorage para sincronizar con cookies
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === AUTH_COOKIE_NAME) {
      try {
        const authState = e.newValue ? JSON.parse(e.newValue) : null;
        if (authState?.state?.isAuthenticated) {
          syncAuthToCookies(true, authState.state.user?.id);
        } else {
          clearAuthCookie();
        }
      } catch (error) {
        console.error('Error syncing auth to cookies:', error);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
