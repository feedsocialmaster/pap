'use client';

import { useEffect, useRef, useState } from 'react';
import api, { apiBaseUrl } from '@/lib/api';

interface ServerTime {
  serverTime: string;
  timezone: string;
  formatted: string;
}

export function useServerTime() {
  const [time, setTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let attempts = 0;
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();

    const endpoint = '/cms/dashboard/server-time';
    const healthEndpoint = '/health';

    const fetchWithRetry = async () => {
      const maxRetries = 3;

      try {
        // Verificar primero el health endpoint con timeout
        await api.get(healthEndpoint, { 
          signal: controller.signal,
          timeout: 5000 // 5 segundos de timeout
        });
        
        // Luego obtener el server time con timeout
        const response = await api.get<ServerTime>(endpoint, { 
          signal: controller.signal,
          timeout: 5000 // 5 segundos de timeout
        });

        if (!cancelled && isMounted.current) {
          setTime(new Date(response.data.serverTime));
          setOffline(false);
          setLoading(false);
          attempts = 0; // Reset attempts on success
        }
      } catch (error: any) {
        // No procesar errores si la petición fue cancelada
        if (cancelled || error.code === 'ERR_CANCELED' || error.message === 'canceled') {
          return;
        }

        attempts += 1;
        const status = error?.response?.status;
        
        // Si es un error 429 (Too Many Requests), esperar más tiempo
        if (status === 429) {
          if (!cancelled && isMounted.current) {
            // En caso de rate limit, usar fallback al tiempo local
            setTime(new Date());
            setOffline(false);
            setLoading(false);
          }
          return;
        }
        
        const codeLabel = status ? `HTTP ${status}` : error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK';
        const message = error?.message || error?.original?.message || 'Error desconocido';
        
        // Solo mostrar advertencia en console, no error
        if (attempts === 1) {
          console.warn(
            `Advertencia al obtener ${apiBaseUrl}${endpoint}. Intento ${attempts}/${maxRetries} (${codeLabel}): ${message}`
          );
        }

        if (attempts <= maxRetries && !cancelled) {
          // Exponential backoff: 2s, 4s, 8s
          const backoffMs = 2000 * Math.pow(2, attempts - 1);
          retryTimeout = setTimeout(fetchWithRetry, backoffMs);
        } else if (!cancelled && isMounted.current) {
          // Usar tiempo local como fallback
          setTime(new Date());
          setOffline(true);
          setLoading(false);
        }
      }
    };

    fetchWithRetry();

    // Update time every second
    const interval = setInterval(() => {
      setTime((prevTime) => new Date(prevTime.getTime() + 1000));
    }, 1000);

    return () => {
      cancelled = true;
      isMounted.current = false;
      if (retryTimeout) clearTimeout(retryTimeout);
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const formatted = time.toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const date = time.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return { time, formatted, date, loading, offline };
}
