import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface GatewayEvent {
  gatewayId?: string;
  changes?: any;
  timestamp: string;
}

interface PriceOverrideEvent {
  productId: string;
  newPrice: number;
  gatewayId: string;
  timestamp: string;
}

interface CartRecalculateEvent {
  cartId: string;
  trigger: string;
  timestamp: string;
}

interface PaymentStatusEvent {
  paymentId: string;
  status: string;
  orderId: string;
  timestamp: string;
}

export function usePaymentGatewayWebSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    const newSocket = io(socketUrl, {
      path: '/ws',
      auth: {
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 60000,
      withCredentials: true,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      // Silenciar en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.debug('WS error (silenciado):', error.message);
      }
      setConnected(false);
    });

    newSocket.on('connect_timeout', () => {
      console.debug('WS timeout (silenciado)');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  const joinCMS = useCallback(() => {
    if (socket) {
      socket.emit('join:cms');
    }
  }, [socket]);

  const joinCart = useCallback(
    (cartId: string) => {
      if (socket) {
        socket.emit('join:cart', cartId);
      }
    },
    [socket]
  );

  const onGatewayUpdated = useCallback(
    (callback: (event: GatewayEvent) => void) => {
      if (socket) {
        socket.on('gateway.updated', callback);
      }
    },
    [socket]
  );

  const onGatewayDeleted = useCallback(
    (callback: (event: GatewayEvent) => void) => {
      if (socket) {
        socket.on('gateway.deleted', callback);
      }
    },
    [socket]
  );

  const onGatewayCreated = useCallback(
    (callback: (event: GatewayEvent) => void) => {
      if (socket) {
        socket.on('gateway.created', callback);
      }
    },
    [socket]
  );

  const onProductPriceOverride = useCallback(
    (callback: (event: PriceOverrideEvent) => void) => {
      if (socket) {
        socket.on('product.price.override', callback);
      }
    },
    [socket]
  );

  const onCartRecalculate = useCallback(
    (callback: (event: CartRecalculateEvent) => void) => {
      if (socket) {
        socket.on('cart.recalculate', callback);
      }
    },
    [socket]
  );

  const onPaymentStatusUpdated = useCallback(
    (callback: (event: PaymentStatusEvent) => void) => {
      if (socket) {
        socket.on('payment.status.updated', callback);
      }
    },
    [socket]
  );

  return {
    socket,
    connected,
    events,
    joinCMS,
    joinCart,
    onGatewayUpdated,
    onGatewayDeleted,
    onGatewayCreated,
    onProductPriceOverride,
    onCartRecalculate,
    onPaymentStatusUpdated,
  };
}
