import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Producto } from '@/types';

interface WishlistState {
  items: Producto[];
  addItem: (producto: Producto) => void;
  removeItem: (productoId: string) => void;
  isInWishlist: (productoId: string) => boolean;
  clearWishlist: () => void;
  getTotalItems: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto) => {
        const { items } = get();
        
        // Verificar si ya está en la wishlist
        if (items.find((item) => item.id === producto.id)) {
          return;
        }

        set({ items: [...items, producto] });
      },

      removeItem: (productoId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productoId),
        }));
      },

      isInWishlist: (productoId) => {
        const { items } = get();
        return items.some((item) => item.id === productoId);
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        const { items } = get();
        return items.length;
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
