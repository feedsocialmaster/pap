'use client';

import React from 'react';
import { useCMSStore } from '@/store/cmsStore';
import { useServerTime } from '@/hooks/useServerTime';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/format';
import { NotificationIcon } from './NotificationIcon';

interface CMSHeaderProps {
  className?: string;
}

export function CMSHeader({ className }: CMSHeaderProps) {
  const { theme, toggleTheme, toggleSidebar } = useCMSStore();
  const { formatted, date, loading, offline } = useServerTime();
  const { logout } = useAuthStore();
  const { addToast } = useToastStore();

  return (
    <header
      className={cn(
        'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800',
        'px-3 md:px-6 py-3 md:py-4 flex items-center justify-between',
        className
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base md:text-xl font-bold text-purple-700 dark:text-white">
            CMS Paso a Paso
          </h1>
          <p className="hidden sm:block text-xs text-purple-600 dark:text-white">
            Versión 1.0.0 | Compilación: 1000
          </p>
        </div>
      </div>

      {/* Center section - Server time (visually hidden) */}
      {!loading && !offline && (
        <div className="sr-only" aria-label="Hora del servidor">
          <div>
            {formatted} GMT-3
          </div>
          <div>{date}</div>
        </div>
      )}

      {/* Center section - Offline status */}
      {!loading && offline && (
        <div className="hidden md:flex flex-col items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Sin conexión al backend
          </div>
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Notifications */}
        <NotificationIcon />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Cambiar tema"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* Logout button */}
        <button
          onClick={() => {
            logout();
            // Store logout message for display on login page
            sessionStorage.setItem('cms_logout_success', 'true');
            window.location.href = '/cms';
          }}
          className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg font-medium text-sm md:text-base"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
