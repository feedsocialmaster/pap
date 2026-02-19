/**
 * Hook para detectar la dirección del scroll
 * Útil para ocultar/mostrar elementos según el scroll
 */

import { useState, useEffect } from 'react';

interface ScrollDirection {
  direction: 'up' | 'down' | null;
  scrollY: number;
}

export function useScrollDirection(threshold: number = 10): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>({
    direction: null,
    scrollY: 0,
  });

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      setScrollDirection({
        direction: scrollY > lastScrollY ? 'down' : 'up',
        scrollY,
      });

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrollDirection;
}

/**
 * Hook para detectar si el usuario ha hecho scroll más allá de cierto punto
 */
export function useScrollThreshold(threshold: number = 100): boolean {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setHasScrolled(window.pageYOffset > threshold);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return hasScrolled;
}
