'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRealtimeStore } from '@/store/realtimeStore';

export function useRealtimeNotifications() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setConnected,
    addNotification,
    setUnreadCount,
    fetchUnreadCount,
    updateOrder,
    addOrder,
  } = useRealtimeStore();

  useEffect(() => {
    // Conectar al WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    const socket = io(wsUrl, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 60000,
      withCredentials: true,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      setConnected(true);

      // Unirse al canal CMS
      socket.emit('join:cms');

      // Obtener contador inicial de notificaciones
      fetchUnreadCount();
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      // Silenciar errores de timeout en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.debug('WebSocket error (silenciado en desarrollo):', error.message);
      } else {
        console.error('Error de conexión WebSocket:', error);
      }
      setConnected(false);
    });

    socket.on('connect_timeout', () => {
      console.debug('WebSocket timeout (silenciado)');
      setConnected(false);
    });

    socket.on('error', (error) => {
      // Silenciar errores menores
      if (process.env.NODE_ENV === 'development') {
        console.debug('WebSocket error (silenciado):', error);
      }
    });

    // Escuchar evento de nueva notificación
    socket.on('notification.new', (data: any) => {
      console.log('🔔 Nueva notificación recibida:', data);
      
      const notification = {
        id: data.id,
        type: data.type,
        payload: data.payload,
        status: data.status || 'UNREAD',
        createdAt: data.createdAt,
        readAt: null,
      };

      addNotification(notification);

      // Mostrar notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nuevo Pedido', {
          body: data.payload.shortText || 'Tienes un nuevo pedido',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      }
    });

    // Escuchar evento de actualización de contador
    socket.on('notification.count', (data: any) => {
      console.log('📊 Contador de notificaciones actualizado:', data.unreadCount);
      setUnreadCount(data.unreadCount);
    });

    // Escuchar evento de nuevo pedido
    socket.on('order.created', (data: any) => {
      console.log('🛍️ Nuevo pedido creado:', data);
      if (data.order) {
        addOrder(data.order);
      }
    });

    // Escuchar evento de actualización de pedido
    socket.on('order.updated', (data: any) => {
      console.log('📦 Pedido actualizado:', data);
      if (data.order) {
        updateOrder(data.order);
      }
    });

    // Solicitar permisos de notificación del navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return socketRef.current;
}
