'use client';

import { useEffect, useState } from 'react';

interface CMSLoadingScreenProps {
  onLoadingComplete?: () => void;
  maxDuration?: number; // en milisegundos, default 10000 (10 segundos)
}

export function CMSLoadingScreen({ onLoadingComplete, maxDuration = 10000 }: CMSLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simular progreso de carga
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Incremento progresivo más rápido al inicio y más lento al final
        const increment = prev < 60 ? 8 : prev < 90 ? 3 : 1;
        return Math.min(prev + increment, 100);
      });
    }, maxDuration / 50); // Dividido en 50 pasos

    // Timer de duración máxima
    const maxTimer = setTimeout(() => {
      setProgress(100);
    }, maxDuration);

    // Timer para ocultar el loading screen
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete?.();
    }, maxDuration + 500); // Dar tiempo para la animación de salida

    return () => {
      clearInterval(progressInterval);
      clearTimeout(maxTimer);
      clearTimeout(hideTimer);
    };
  }, [maxDuration, onLoadingComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark transition-opacity duration-500 ${
        progress === 100 ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center space-y-8 px-4">
        {/* Logo animado con zapato */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Círculo de fondo pulsante */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse"></div>
          
          {/* Icono de zapato SVG */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <svg
              className="w-20 h-20 text-primary-light animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20.49 8.99c-.29-.29-.77-.29-1.06 0L17 11.42V4c0-.55-.45-1-1-1s-1 .45-1 1v7.42l-2.43-2.43c-.29-.29-.77-.29-1.06 0-.29.29-.29.77 0 1.06l3.54 3.54c.29.29.77.29 1.06 0l3.54-3.54c.29-.29.29-.77 0-1.06z" />
              <path d="M3 15c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-1H3v1zm0-3h18v-1c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v1z" />
            </svg>
          </div>

          {/* Círculo de progreso */}
          <svg className="absolute inset-0 -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="60"
              stroke="#8B1400"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
            />
          </svg>
        </div>

        {/* Título principal */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
            Sistema de Administración de
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-light via-accent to-secondary bg-clip-text text-transparent animate-pulse">
            Gestión de Contenidos
          </h2>
        </div>

        {/* Barra de progreso */}
        <div className="w-full max-w-md mx-auto space-y-2">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
          <p className="text-sm text-gray-300 font-medium">
            Cargando {progress}%
          </p>
        </div>

        {/* Texto de estado con animación */}
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          <span className="text-sm">Inicializando sistema</span>
          <span className="flex space-x-1">
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        </div>

        {/* Marca de agua inferior */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Paso a Paso Shoes
          </p>
        </div>
      </div>
    </div>
  );
}
