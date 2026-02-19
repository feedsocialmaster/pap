import axios from 'axios';

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// URL base del servidor (sin /api) para archivos estáticos como uploads
export const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000, // Aumentado a 30 segundos para evitar timeouts prematuros
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error?.response) {
      return Promise.reject({
        isNetworkError: true,
        message: error?.message || 'Network Error',
        original: error,
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Maneja errores de API de manera silenciosa para errores comunes
 * @param error Error de axios
 * @param context Contexto de la operación para logging
 * @returns true si el error debe ser silenciado, false si debe propagarse
 */
export function shouldSilenceError(error: any, context?: string): boolean {
  // Silenciar errores 429 (Too Many Requests) - el rate limiting se manejará automáticamente
  if (error?.response?.status === 429) {
    return true;
  }
  
  // Silenciar timeouts en desarrollo (común durante hot reload)
  if (error?.code === 'ECONNABORTED' && process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Silenciar errores de red durante desarrollo
  if (error?.isNetworkError && process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
}

/**
 * Registra errores de manera apropiada según el tipo
 * @param error Error a registrar
 * @param context Contexto de la operación
 */
export function logApiError(error: any, context: string): void {
  if (shouldSilenceError(error, context)) {
    // No mostrar nada para errores silenciados
    return;
  }
  
  const status = error?.response?.status;
  const message = error?.response?.data?.error || error?.message || 'Error desconocido';
  
  // Solo mostrar advertencia en lugar de error
  console.warn(`[${context}] Error ${status || 'NETWORK'}:`, message);
}

export default api;