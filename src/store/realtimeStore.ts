'use client';

import { create } from 'zustand';
import { apiBaseUrl } from '@/lib/api';

// Función auxiliar para obtener el token JWT
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return null;
  try {
    const { state } = JSON.parse(authStorage);
    return state?.token || null;
  } catch {
    return null;
  }
}

// Función auxiliar para crear headers con autenticación
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[RealtimeStore] Petición sin token de autenticación');
  }
  return headers;
}

// Función auxiliar para fetch con timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export interface DashboardStats {
  salesToday: number;
  revenueToday: number;
  ordersToday: number;
  pendingOrders: number;
}

export interface Order {
  id: string;
  numeroOrden: string;
  fecha: string;
  total: number;
  subtotal?: number;
  cmsStatus: 'PENDING' | 'PAYMENT_REJECTED' | 'PAYMENT_APPROVED' | 'PREPARING' | 'READY_FOR_SHIPPING' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'NOT_DELIVERED' | 'CANCELLED' | 'INVENTORY_ERROR';
  fulfillmentType?: 'shipping' | 'pickup' | null;
  pickupLocationId?: string | null;
  deliveryReason?: string | null;
  deliveredAt?: string | null;
  paymentApprovedAt?: string | null;
  preparingStartedAt?: string | null;
  readyForShippingAt?: string | null;
  readyForPickupAt?: string | null;
  shippedAt?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  cancellationReason?: string | null;
  paymentMethodDetail?: string;
  installments?: number; // Cuotas de pago (1, 3, 6, 9, 12)
  facturaUrl?: string | null; // URL del PDF de factura subido desde CMS
  direccionEnvio?: {
    calle?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
  version: number;
  items: OrderItem[];
  usuario: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    telefono?: string | null;
  };
  payment?: PaymentInfo | null;
  gatewayPayments?: PaymentInfo[];
}

export interface OrderItem {
  id: string;
  productId: string;
  cantidad: number;
  talle: number;
  color?: string;
  precioUnitario: number;
  precioOriginal?: number | null;
  descuentoMonto?: number | null;
  promocionId?: string | null;
  promocionNombre?: string | null;
  product: {
    id: string;
    nombre: string;
    precio: number;
  };
}

export interface PaymentInfo {
  currency?: string;
  metadata?: {
    installments?: number;
    payment_method_id?: string;
  };
}

export interface CMSNotification {
  id: string;
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED' | 'PAYMENT_RECEIVED' | 'SYSTEM_ALERT';
  payload: {
    orderId: string;
    numeroOrden?: string;
    customerName?: string;
    customerEmail?: string;
    total?: number;
    shortText?: string;
    cmsStatus?: string;
    [key: string]: unknown;
  };
  status: 'UNREAD' | 'READ';
  createdAt: string;
  readAt?: string | null;
}

interface RealtimeState {
  // Dashboard stats
  dashboardStats: DashboardStats | null;
  
  // Orders
  orders: Order[];
  selectedOrder: Order | null;
  
  // Notifications
  notifications: CMSNotification[];
  unreadCount: number;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // WebSocket connection
  isConnected: boolean;
  
  // Actions
  setDashboardStats: (stats: DashboardStats) => void;
  setOrders: (orders: Order[]) => void;
  setSelectedOrder: (order: Order | null) => void;
  updateOrder: (order: Order) => void;
  addOrder: (order: Order) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  
  // Notification actions
  setNotifications: (notifications: CMSNotification[]) => void;
  addNotification: (notification: CMSNotification) => void;
  setUnreadCount: (count: number) => void;
  markNotificationAsRead: (id: string) => void;
  
  // Fetch actions
  fetchDashboardStats: () => Promise<void>;
  fetchOrders: (params?: { status?: string[]; from?: string; to?: string }) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: string, extraData?: { deliveryReason?: string; cancellationReason?: string; trackingNumber?: string; courierName?: string; notes?: string }) => Promise<void>;
  approveOrder: (orderId: string, notes?: string) => Promise<void>;
  rejectOrder: (orderId: string, reason: string, notes?: string) => Promise<void>;
  fetchNotifications: (status?: 'UNREAD' | 'READ' | 'all') => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearReadNotifications: () => Promise<{ deletedCount: number }>;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  // Initial state
  dashboardStats: null,
  orders: [],
  selectedOrder: null,
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  isConnected: false,

  // Setters
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setOrders: (orders) => set({ orders }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setConnected: (connected) => set({ isConnected: connected }),

  // Notification setters
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.status === 'UNREAD' ? state.unreadCount + 1 : state.unreadCount,
    }));
  },
  setUnreadCount: (count) => set({ unreadCount: count }),
  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  updateOrder: (updatedOrder) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      ),
      selectedOrder:
        state.selectedOrder?.id === updatedOrder.id
          ? { ...state.selectedOrder, ...updatedOrder }
          : state.selectedOrder,
    }));
  },

  addOrder: (newOrder) => {
    set((state) => ({
      orders: [newOrder, ...state.orders],
    }));
  },

  // Fetch actions
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/dashboard/stats`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }

      const data = await response.json();
      set({ dashboardStats: data.data, loading: false });
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido', loading: false });
    }
  },

  fetchOrders: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) {
        params.status.forEach((s) => queryParams.append('status', s));
      }
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);

      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/ventas/realizadas?${queryParams}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      }, 30000); // Aumentar timeout a 30 segundos

      if (!response.ok) {
        // Si es error 429 (rate limit), simplemente no hacer nada
        if (response.status === 429) {
          set({ loading: false });
          return;
        }
        // Si es error 401, no autenticado - silenciar
        if (response.status === 401) {
          set({ loading: false, error: null });
          return;
        }
        throw new Error('Error al obtener órdenes');
      }

      const data = await response.json();
      // Debug: ver qué datos llegan de la API
      if (process.env.NODE_ENV === 'development' && data.data?.orders?.length > 0) {
        console.log('📦 [RealtimeStore] Primera orden recibida:', {
          id: data.data.orders[0].id,
          fecha: data.data.orders[0].fecha,
          total: data.data.orders[0].total,
          installments: data.data.orders[0].installments, // DEBUG: Verificar cuotas
          paymentMethodDetail: data.data.orders[0].paymentMethodDetail, // DEBUG: método de pago
          keys: Object.keys(data.data.orders[0])
        });
      }
      set({ orders: data.data.orders, loading: false });
    } catch (error: unknown) {
      // Solo establecer error si no es un problema de red/timeout
      if (error instanceof Error) {
        // Silenciar timeouts en desarrollo
        if(error.message.includes('aborted') || error.message.includes('timeout')) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[RealtimeStore] fetchOrders timeout - servidor ocupado');
          }
          set({ loading: false, error: null });
          return;
        }
        
        if (!error.message.includes('fetch')) {
          set({ error: error.message, loading: false });
        } else {
          set({ loading: false, error: null });
        }
      } else {
        set({ loading: false, error: null });
      }
    }
  },

  updateOrderStatus: async (orderId, newStatus, extraData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/pedidos/${orderId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          newStatus,
          deliveryReason: extraData?.deliveryReason,
          cancellationReason: extraData?.cancellationReason,
          trackingNumber: extraData?.trackingNumber,
          courierName: extraData?.courierName,
          notes: extraData?.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar pedido');
      }

      const data = await response.json();
      
      // Actualizar orden en el estado
      get().updateOrder(data.order);
      
      set({ loading: false });
      
      return data.order;
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido', loading: false });
      throw error;
    }
  },

  approveOrder: async (orderId, notes) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/pedidos/${orderId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al aprobar pedido');
      }

      const data = await response.json();
      
      // Remover orden de la lista de pendientes
      set((state) => ({
        orders: state.orders.filter(o => o.id !== orderId),
        loading: false,
      }));
      
      return data.order;
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido', loading: false });
      throw error;
    }
  },

  rejectOrder: async (orderId, reason, notes) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/pedidos/${orderId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ reason, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al rechazar pedido');
      }

      const data = await response.json();
      
      // Remover orden de la lista de pendientes
      set((state) => ({
        orders: state.orders.filter(o => o.id !== orderId),
        loading: false,
      }));
      
      return data.order;
    } catch (error: unknown) {
      set({ error: error instanceof Error ? error.message : 'Error desconocido', loading: false });
      throw error;
    }
  },

  // Fetch notifications
  fetchNotifications: async (status = 'all') => {
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/notifications?status=${status}&limit=50`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        // Si es error 429 (rate limit), simplemente no hacer nada
        if (response.status === 429) {
          return;
        }
        throw new Error('Error al obtener notificaciones');
      }

      const data = await response.json();
      set({
        notifications: data.data.notifications,
        unreadCount: data.data.unreadCount,
      });
    } catch (error: unknown) {
      // Solo mostrar advertencia si no es un error de red o timeout
      if (error instanceof Error && !error.message.includes('fetch') && !error.message.includes('timeout')) {
        console.warn('Advertencia al obtener notificaciones:', error.message);
      }
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/notifications/unread-count`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        // Si es error 429 (rate limit), simplemente no hacer nada
        if (response.status === 429) {
          return;
        }
        throw new Error('Error al obtener contador');
      }

      const data = await response.json();
      set({ unreadCount: data.data.unreadCount });
    } catch (error: unknown) {
      // Solo mostrar advertencia si no es un error de red o timeout
      if (error instanceof Error && !error.message.includes('fetch') && !error.message.includes('timeout')) {
        console.warn('Advertencia al obtener contador:', error.message);
      }
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al marcar como leída');
      }

      // Actualizar estado local
      get().markNotificationAsRead(notificationId);
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error);
    }
  },

  clearReadNotifications: async () => {
    try {
      const response = await fetchWithTimeout(`${apiBaseUrl}/cms/notifications/clear-read`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al limpiar notificaciones');
      }

      const data = await response.json();

      // Actualizar estado local - eliminar notificaciones leídas
      set((state) => ({
        notifications: state.notifications.filter((n) => n.status !== 'READ'),
      }));

      return { deletedCount: data.data.deletedCount };
    } catch (error: unknown) {
      console.error('Error clearing read notifications:', error);
      throw error;
    }
  },
}));
