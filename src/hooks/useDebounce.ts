/**
 * Hook para debounce - retrasa la ejecución de una función
 * Útil para optimizar búsquedas en tiempo real y filtros
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para throttle - limita la frecuencia de ejecución
 * Útil para eventos que se disparan muy seguido (scroll, resize)
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);

  useEffect(() => {
    let lastRan = Date.now();
    let timeout: NodeJS.Timeout;

    const handler = () => {
      const timeLeft = interval - (Date.now() - lastRan);

      if (timeLeft <= 0) {
        setThrottledValue(value);
        lastRan = Date.now();
      } else {
        timeout = setTimeout(() => {
          setThrottledValue(value);
          lastRan = Date.now();
        }, timeLeft);
      }
    };

    handler();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [value, interval]);

  return throttledValue;
}
