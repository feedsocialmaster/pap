'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/utils/format';

interface CMSFooterProps {
  className?: string;
}

export function CMSFooter({ className }: CMSFooterProps) {
  return (
    <footer
      className={cn(
        'bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800',
        'px-3 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-3',
        className
      )}
    >
      <div className="text-xs md:text-sm text-purple-600 dark:text-white text-center sm:text-left">
        <p>Entorno y Código desarrollado por <span className="font-semibold">Medinexa S.A.</span></p>
        <p className="text-xs mt-1">© {new Date().getFullYear()} Paso a Paso Shoes. Todos los derechos reservados.</p>
      </div>

      {/* WhatsApp Help Button */}
      <a
        href="https://wa.me/5492616976555?text=Hola,%20tengo%20una%20consulta%20sobre%20el%20CMS"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
      >
        <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
        <div className="flex flex-col items-start">
          <span className="text-xs md:text-sm font-medium">¿Dudas?</span>
          <span className="text-xs hidden sm:block">Envíame un mensaje</span>
        </div>
      </a>
    </footer>
  );
}
