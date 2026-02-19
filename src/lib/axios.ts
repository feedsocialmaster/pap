import api, { apiBaseUrl } from './api';

// Reutilizar instancia centralizada y extender configuración
const axiosInstance = api;
axiosInstance.defaults.timeout = 15000; // Aumentado a 15 segundos
axiosInstance.defaults.headers['Content-Type'] = 'application/json';

// Interceptor para agregar token de autenticación
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          if (state?.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
            // Log para depuración en desarrollo
            if (process.env.NODE_ENV === 'development') {
              console.log('[Axios Interceptor] Token agregado a petición:', config.url);
            }
          }
        } catch (error) {
          console.error('[Axios Interceptor] Error parseando authStorage:', error);
        }
      }
      // No mostrar warning para rutas públicas (sin auth requerida)
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable para evitar mostrar múltiples veces el mismo error
let networkErrorShown = false;

// Interceptor para manejar errores de respuesta
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo procesar errores en el cliente
    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }
    
    if (error.response) {
      // Error de respuesta del servidor
      const { status } = error.response;
      
      if (status === 401) {
        // Token inválido o expirado - solo redirigir si el usuario tenía sesión activa
        const authStorage = localStorage.getItem('auth-storage');
        let hadActiveSession = false;
        if (authStorage) {
          try {
            const { state } = JSON.parse(authStorage);
            hadActiveSession = !!state?.token || !!state?.isAuthenticated;
          } catch {
            // ignore
          }
        }

        localStorage.removeItem('auth-storage');

        if (hadActiveSession) {
          // Redirigir según el contexto (CMS o tienda)
          const isCMSPage = window.location.pathname.startsWith('/cms');
          if (isCMSPage) {
            window.location.href = '/cms/login';
          } else {
            window.location.href = '/login';
          }
        }
        // Si no había sesión activa, simplemente rechazar el error sin redirigir
      }
      
      if (status === 403) {
        console.error('Acceso denegado');
      }
      
      if (status >= 500) {
        console.error('Error del servidor');
      }
    } else if (error.request) {
      // Error de red - el servidor no respondió
      const baseURL = axiosInstance.defaults.baseURL || apiBaseUrl;
      
      // Solo mostrar el error una vez para evitar spam en consola
      if (process.env.NODE_ENV === 'development' && !networkErrorShown) {
        console.error(`Error de conexión al servidor API: ${baseURL}. Verifica que el servidor backend esté ejecutándose.`);
        console.error('Detalles del error:', error.message);
        networkErrorShown = true;
        
        // Resetear después de 10 segundos
        setTimeout(() => { networkErrorShown = false; }, 10000);
      }
      
      // En producción o cuando no se puede conectar, proporcionar un error más amigable
      error.userMessage = 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
    } else {
      // No mostrar errores de cancelación (AbortController)
      if (error.message !== 'canceled' && error.code !== 'ERR_CANCELED') {
        console.error('Error al configurar la petición:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
