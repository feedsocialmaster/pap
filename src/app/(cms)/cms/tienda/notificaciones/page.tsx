'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withCMSProtection } from '@/components/cms/withCMSProtection';

function NotificacionesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cms/tienda/productos');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <p className="text-gray-600 dark:text-gray-400">Redirigiendo...</p>
    </div>
  );
}

export default withCMSProtection(NotificacionesRedirectPage);
