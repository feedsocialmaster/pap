'use client';

import React, { useEffect } from 'react';
import { CMSSidebar } from './CMSSidebar';
import { CMSHeader } from './CMSHeader';
import { CMSFooter } from './CMSFooter';
import { RealtimeProvider } from './RealtimeProvider';
import { useCMSStore } from '@/store/cmsStore';
import { useToastStore } from '@/store/toastStore';
import ToastContainer from '@/components/ui/Toast';

interface CMSLayoutProps {
  children: React.ReactNode;
}

export function CMSLayout({ children }: CMSLayoutProps) {
  const { theme } = useCMSStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    // Aplicar tema al documento
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Check for login success message from session storage
  useEffect(() => {
    const loginSuccess = sessionStorage.getItem('cms_login_success');
    if (loginSuccess) {
      sessionStorage.removeItem('cms_login_success');
      addToast({
        type: 'success',
        title: 'Inicio de sesión exitoso',
        message: 'Bienvenido al CMS de Paso a Paso',
      });
    }
  }, [addToast]);

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <CMSHeader />
        <div className="flex flex-1 overflow-hidden">
          <CMSSidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-4 md:px-6 md:py-6">{children}</div>
          </main>
        </div>
        <CMSFooter />
        <ToastContainer />
      </div>
    </RealtimeProvider>
  );
}
