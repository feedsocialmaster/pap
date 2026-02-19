'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para conectar y gestionar WebSocket con Socket.IO
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());
  // Estado para forzar re-render cuando el socket se conecta
  const [connected, setConnected] = useState(false);

  /**
   * Conectar al servidor WebSocket
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const socket = io(url, {
      path: '/ws',
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 60000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (error: unknown) => {
      // Silenciar errores de timeout en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.debug('WS error (silenciado):', (error as Error).message);
      } else {
        console.error('WebSocket connection error:', error);
        onError?.(error as Error);
      }
    });

    socket.on('connect_timeout', () => {
      console.debug('WS timeout (silenciado)');
    });

    socket.on('error', (error: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug('WS error (silenciado):', error);
      }
    });

    socketRef.current = socket;
    return socket;
  }, [url, onConnect, onDisconnect, onError]);

  /**
   * Desconectar del servidor WebSocket
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  /**
   * Suscribirse a un evento
   */
  const subscribe = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn('WebSocket not connected. Call connect() first.');
      return () => {};
    }

    // Registrar listener
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    // Suscribirse al evento
    socketRef.current.on(event, handler);

    // Retornar función de cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handler);
      }
      const listeners = listenersRef.current.get(event);
      if (listeners) {
        listeners.delete(handler);
        if (listeners.size === 0) {
          listenersRef.current.delete(event);
        }
      }
    };
  }, []);

  /**
   * Emitir un evento al servidor
   */
  const emit = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn('WebSocket not connected. Cannot emit event:', event);
      return;
    }
    socketRef.current.emit(event, data);
  }, []);

  /**
   * Unirse a un canal
   */
  const joinChannel = useCallback((channel: string) => {
    emit(`join:${channel}`);
  }, [emit]);

  /**
   * Salir de un canal
   */
  const leaveChannel = useCallback((channel: string) => {
    emit(`leave:${channel}`);
  }, [emit]);

  /**
   * Obtener estado de conexión
   */
  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  // Auto-conectar si está habilitado
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Limpiar todos los listeners
      listenersRef.current.forEach((listeners, event) => {
        listeners.forEach((handler) => {
          socketRef.current?.off(event, handler);
        });
      });
      listenersRef.current.clear();
    };
  }, [autoConnect, connect]);

  return {
    connect,
    disconnect,
    subscribe,
    emit,
    joinChannel,
    leaveChannel,
    isConnected,
    connected,
    socket: socketRef.current,
  };
}

/**
 * Hook específico para eventos del CMS
 */
export function useCMSWebSocket() {
  const ws = useWebSocket({
    autoConnect: true,
  });

  useEffect(() => {
    if (ws.isConnected()) {
      ws.joinChannel('cms');
    }
  }, [ws]);

  return ws;
}
