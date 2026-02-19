'use client';

import { useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  // Inicializar conexión WebSocket y escuchar eventos
  useRealtimeNotifications();

  return <>{children}</>;
}
