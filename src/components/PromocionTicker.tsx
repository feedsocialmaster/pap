'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from '@/lib/axios';
import { useWebSocket } from '@/hooks/useWebSocket';

type Promocion = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'promocion' | 'codigo';
};

type CodigoPromocional = {
  id: string;
  codigo: string;
  descuento: number | null;
  tipoDescuento: string;
  tipoBundle: string | null;
  activo: boolean;
};

// Helper para obtener etiqueta legible del bundle
function getBundleLabelTicker(tipoBundle: string): string {
  const labels: Record<string, string> = {
    'DOS_POR_UNO': '2x1',
    'TRES_POR_DOS': '3x2',
    'CUATRO_POR_TRES': '4x3',
    'CINCO_POR_DOS': '5x2',
    'CINCO_POR_TRES': '5x3',
  };
  return labels[tipoBundle] || tipoBundle;
}

export default function PromocionTicker() {
  const [items, setItems] = useState<Promocion[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [animando, setAnimando] = useState(false);
  const { socket, connect, disconnect, subscribe } = useWebSocket();

  const cargarTodo = useCallback(async () => {
    try {
      console.log('🎯 [PromocionTicker] Cargando promociones y códigos...');
      
      const [promocionesRes, codigosRes] = await Promise.all([
        axios.get('/promociones/vigentes'),
        axios.get('/codigos-promocionales/activos')
      ]);
      
      const todosLosItems: Promocion[] = [];
      
      // Agregar promociones
      if (promocionesRes.data.success && promocionesRes.data.promociones) {
        promocionesRes.data.promociones.forEach((promo: any) => {
          todosLosItems.push({
            id: promo.id,
            titulo: promo.titulo,
            descripcion: promo.descripcion,
            tipo: 'promocion'
          });
        });
      }
      
      // Agregar códigos promocionales
      if (codigosRes.data.success && codigosRes.data.codigos) {
        codigosRes.data.codigos.forEach((codigo: CodigoPromocional) => {
          let descuentoTexto = '';
          
          // Determinar el texto del descuento según el tipo
          if (codigo.tipoBundle && !codigo.descuento) {
            // Solo bundle (ej: 5x3, 2x1)
            descuentoTexto = getBundleLabelTicker(codigo.tipoBundle);
          } else if (codigo.descuento && !codigo.tipoBundle) {
            // Solo porcentaje o monto fijo
            descuentoTexto = codigo.tipoDescuento === 'PORCENTAJE' 
              ? `${codigo.descuento}% OFF` 
              : codigo.tipoDescuento === 'MONTO_FIJO'
              ? `-$${(codigo.descuento / 100).toFixed(2)}`
              : `${codigo.descuento}% OFF`;
          } else if (codigo.tipoBundle && codigo.descuento) {
            // Ambos (bundle + porcentaje)
            descuentoTexto = `${getBundleLabelTicker(codigo.tipoBundle)} + ${codigo.descuento}% OFF`;
          } else {
            // Fallback
            descuentoTexto = 'Descuento especial';
          }
          
          todosLosItems.push({
            id: codigo.id,
            titulo: `Código: ${codigo.codigo}`,
            descripcion: `${descuentoTexto} en tu compra`,
            tipo: 'codigo'
          });
        });
      }
      
      console.log('✅ [PromocionTicker] Items cargados:', todosLosItems.length);
      setItems(todosLosItems);
    } catch (error) {
      console.error('❌ [PromocionTicker] Error al cargar:', error);
      setItems([]);
    }
  }, []);

  // Cargar inicial y conectar WebSocket
  useEffect(() => {
    cargarTodo();
    connect();
    
    // Recargar cada 5 minutos como fallback
    const interval = setInterval(cargarTodo, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, [cargarTodo, connect, disconnect]);

  // Escuchar eventos de WebSocket para actualizar en tiempo real
  useEffect(() => {
    if (!socket?.connected || !subscribe) return;

    const handlePromocionesRefresh = () => {
      console.log('🔄 [PromocionTicker] Evento WebSocket recibido - Refrescando...');
      cargarTodo();
    };

    const unsubscribe = subscribe('promociones.refresh', handlePromocionesRefresh);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [socket, subscribe, cargarTodo]);

  // Resetear índice cuando cambien los items
  useEffect(() => {
    if (indiceActual >= items.length && items.length > 0) {
      setIndiceActual(0);
    }
  }, [items, indiceActual]);

  // Efecto para rotar los items con animación
  useEffect(() => {
    if (items.length <= 1) return;

    const rotacionInterval = setInterval(() => {
      setAnimando(true);
      
      setTimeout(() => {
        setIndiceActual((prevIndice) => (prevIndice + 1) % items.length);
        setAnimando(false);
      }, 400); // Duración de la animación de salida
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(rotacionInterval);
  }, [items.length]);

  if (items.length === 0) return null;

  const itemActual = items[indiceActual];
  
  // Validación adicional para evitar undefined
  if (!itemActual) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-gradient-to-r from-primary/90 via-primary-dark/90 to-primary/90 text-white py-3 overflow-hidden backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center text-center h-8 relative">
          <div 
            key={itemActual.id}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              animando ? 'animate-slide-up' : 'animate-slide-down'
            }`}
          >
            <div>
              <span className="font-bold text-base md:text-lg">
                {itemActual.titulo}
              </span>
              <span className="text-base md:text-lg mx-1">.</span>
              <span className="font-normal text-base md:text-lg">
                {itemActual.descripcion}
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores de paginación si hay múltiples items */}
        {items.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {items.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === indiceActual 
                    ? 'w-6 bg-white' 
                    : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(100%);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.4s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
