import { create } from 'zustand';
import { FiltrosTienda, TipoCalzado } from '@/types';

interface FilterState extends FiltrosTienda {
  // Actions
  setTalles: (talles: number[]) => void;
  setTipoCalzado: (tipos: TipoCalzado[]) => void;
  setRangoPrecio: (min: number, max: number) => void;
  setSearch: (q: string) => void;
  setStockRange: (min: number, max: number) => void;
  setSort: (s: 'price_asc' | 'price_desc' | 'newest') => void;
  toggleDescuentoPuntos: () => void;
  toggleCodigoPromocional: () => void;
  toggleEnLiquidacion: () => void;
  resetFilters: () => void;
}

const initialState: FiltrosTienda = {
  talle: [],
  tipoCalzado: [],
  rangoPrecio: {
    min: 0,
    max: 300000,
  },
  search: '',
  stockRange: {
    min: 0,
    max: 9999,
  },
  sort: 'newest',
  descuentoPuntos: false,
  codigoPromocional: false,
  enLiquidacion: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setTalles: (talles) => set({ talle: talles }),
  
  setTipoCalzado: (tipos) => set({ tipoCalzado: tipos }),
  
  setRangoPrecio: (min, max) => set({ 
    rangoPrecio: { min, max } 
  }),
  setSearch: (q) => set({ search: q }),
  setStockRange: (min, max) => set({ stockRange: { min, max } }),
  setSort: (s) => set({ sort: s }),
  
  toggleDescuentoPuntos: () => set((state) => ({ 
    descuentoPuntos: !state.descuentoPuntos 
  })),
  
  toggleCodigoPromocional: () => set((state) => ({ 
    codigoPromocional: !state.codigoPromocional 
  })),
  
  toggleEnLiquidacion: () => set((state) => ({ 
    enLiquidacion: !state.enLiquidacion 
  })),
  
  resetFilters: () => set(initialState),
}));
