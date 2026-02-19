import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ItemCarrito, Producto } from '@/types';

interface CuponAplicado {
  codigo: string;
  descuento: number | null;
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO';
  tipoBundle?: string | null;
  combinable?: boolean;
  descripcion?: string;
}

interface CartState {
  items: ItemCarrito[];
  cuponAplicado: CuponAplicado | null;
  
  // Computed values
  getTotalItems: () => number;
  getSubtotal: () => number;
  
  // Actions
  addItem: (producto: Producto, cantidad: number, talle: number, color?: string) => void;
  removeItem: (productoId: string, talle: number) => void;
  updateQuantity: (productoId: string, talle: number, cantidad: number) => void;
  clearCart: () => void;
  setCupon: (cupon: CuponAplicado | null) => void;
  removeCupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cuponAplicado: null,

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          return total + (item.precioUnitario * item.cantidad);
        }, 0);
      },

      addItem: (producto, cantidad, talle, color) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            item => item.producto.id === producto.id && item.talle === talle
          );

          if (existingItemIndex > -1) {
            // Si el item ya existe, actualizar cantidad
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].cantidad += cantidad;
            return { items: updatedItems };
          } else {
            // Si es nuevo, agregarlo
            const newItem: ItemCarrito = {
              producto,
              cantidad,
              talle,
              color,
              precioUnitario: producto.precio,
            };
            return { items: [...state.items, newItem] };
          }
        });
      },

      removeItem: (productoId, talle) => {
        set((state) => ({
          items: state.items.filter(
            item => !(item.producto.id === productoId && item.talle === talle)
          ),
        }));
      },

      updateQuantity: (productoId, talle, cantidad) => {
        set((state) => {
          const updatedItems = state.items.map(item => {
            if (item.producto.id === productoId && item.talle === talle) {
              return { ...item, cantidad: Math.max(1, cantidad) };
            }
            return item;
          });
          return { items: updatedItems };
        });
      },

      clearCart: () => set({ items: [], cuponAplicado: null }),

      setCupon: (cupon) => set({ cuponAplicado: cupon }),

      removeCupon: () => set({ cuponAplicado: null }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
