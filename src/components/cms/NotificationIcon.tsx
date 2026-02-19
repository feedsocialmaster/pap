'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRealtimeStore, CMSNotification } from '@/store/realtimeStore';
import { cn } from '@/utils/format';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationIconProps {
  className?: string;
}

export function NotificationIcon({ className }: NotificationIconProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    clearReadNotifications,
  } = useRealtimeStore();

  const [isClearing, setIsClearing] = useState(false);

  // Cargar notificaciones al montar
  useEffect(() => {
    fetchNotifications('all');
    fetchUnreadCount();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification: CMSNotification) => {
    // Marcar como leída
    if (notification.status === 'UNREAD') {
      await markAsRead(notification.id);
    }

    // Cerrar menú
    setIsOpen(false);

    // Navegar a pedidos pendientes con el pedido resaltado
    const orderId = notification.payload.orderId;
    router.push(`/cms/pedidos/pendientes?focusOrder=${orderId}`);
  };

  const handleClearNotifications = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearReadNotifications();
    } catch (error) {
      console.error('Error al limpiar notificaciones:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const unreadNotifications = notifications.filter((n) => n.status === 'UNREAD');
  const readNotifications = notifications.filter((n) => n.status === 'READ');

  const getNotificationIcon = (type: CMSNotification['type']) => {
    switch (type) {
      case 'ORDER_CREATED':
        return '🛍️';
      case 'ORDER_UPDATED':
        return '📦';
      case 'ORDER_DELIVERED':
        return '✅';
      case 'ORDER_CANCELLED':
        return '❌';
      case 'PAYMENT_RECEIVED':
        return '💰';
      default:
        return '🔔';
    }
  };

  const getNotificationTitle = (notification: CMSNotification) => {
    switch (notification.type) {
      case 'ORDER_CREATED':
        return 'Nuevo Pedido';
      case 'ORDER_UPDATED':
        return 'Pedido Actualizado';
      case 'ORDER_DELIVERED':
        return 'Pedido Entregado';
      case 'ORDER_CANCELLED':
        return 'Pedido Cancelado';
      case 'PAYMENT_RECEIVED':
        return 'Pago Recibido';
      default:
        return 'Notificación';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
          className
        )}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Menú contextual de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Contenido scrolleable */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No hay notificaciones
              </div>
            ) : (
              <>
                {/* No leídas */}
                {unreadNotifications.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">
                        No leídas ({unreadNotifications.length})
                      </p>
                    </div>
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        getIcon={getNotificationIcon}
                        getTitle={getNotificationTitle}
                      />
                    ))}
                  </div>
                )}

                {/* Leídas */}
                {readNotifications.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        Leídas ({readNotifications.length})
                      </p>
                      <button
                        onClick={handleClearNotifications}
                        disabled={isClearing}
                        className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
                      >
                        {isClearing ? 'Limpiando...' : 'Limpiar'}
                      </button>
                    </div>
                    {readNotifications.slice(0, 10).map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={() => handleNotificationClick(notification)}
                        getIcon={getNotificationIcon}
                        getTitle={getNotificationTitle}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/cms/pedidos/pendientes');
                }}
                className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                Ver todos los pedidos pendientes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: CMSNotification;
  onClick: () => void;
  getIcon: (type: CMSNotification['type']) => string;
  getTitle: (notification: CMSNotification) => string;
}

function NotificationItem({ notification, onClick, getIcon, getTitle }: NotificationItemProps) {
  const isUnread = notification.status === 'UNREAD';
  
  let timeAgo = 'Hace un momento';
  try {
    const date = new Date(notification.createdAt);
    if (!isNaN(date.getTime())) {
      timeAgo = formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      });
    }
  } catch (error) {
    console.error('Error al formatear fecha de notificación:', notification.createdAt, error);
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0',
        isUnread && 'bg-purple-50/50 dark:bg-purple-900/10'
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 text-2xl">{getIcon(notification.type)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm font-medium',
                isUnread
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {getTitle(notification)}
            </p>
            {isUnread && (
              <span className="flex-shrink-0 w-2 h-2 bg-purple-600 rounded-full mt-1" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
            {notification.payload.shortText || notification.payload.customerName}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-500">
            <span>Pedido #{notification.payload.numeroOrden}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
