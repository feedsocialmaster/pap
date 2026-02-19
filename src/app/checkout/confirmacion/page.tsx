"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';

interface OrderItemVM {
  id: string;
  productId: string;
  nombre: string;
  imagen: string | null;
  cantidad: number;
  talle: number;
  color?: string;
  precioUnitario: number; // pesos
}

interface OrderVM {
  id: string;
  numeroOrden: string;
  fecha: string;
  estado: string;
  total: number; // pesos
  items: OrderItemVM[];
}

function ConfirmacionContent() {
  const search = useSearchParams();
  const router = useRouter();
  const status = search.get('status');
  const orderId = search.get('orderId');
  const [order, setOrder] = useState<OrderVM | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!orderId) { setLoading(false); return; }
      try {
        const res = await axios.get(`/orders/${orderId}`);
        const d = res.data?.data;
        type ApiOrderItem = {
          id: string; productId: string; cantidad: number; talle: number; color?: string; precioUnitario: number; product?: { nombre?: string; imagenes?: { url: string }[] };
        };
        const vm: OrderVM = {
          id: d.id,
          numeroOrden: d.numeroOrden,
          fecha: d.fecha,
          estado: d.estado,
          total: Math.round(d.total) / 100,
          items: (d.items as ApiOrderItem[] | undefined || []).map((it) => ({
            id: it.id,
            productId: it.productId,
            nombre: it.product?.nombre || 'Producto',
            imagen: it.product?.imagenes?.[0]?.url || null,
            cantidad: it.cantidad,
            talle: it.talle,
            color: it.color || undefined,
            precioUnitario: Math.round(it.precioUnitario) / 100,
          })),
        };
        setOrder(vm);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  return (
    <div className="container-custom py-16">
      <h1 className="text-3xl font-bold mb-4">{status === 'approved' ? '¡Gracias por tu compra!' : status === 'pending' ? 'Pago pendiente' : status === 'failure' ? 'Pago rechazado' : 'Confirmación de compra'}</h1>
      {!orderId && (
        <div className="text-gray mb-6">No se encontró el pedido.</div>
      )}
      {loading ? (
        <div className="text-gray">Cargando pedido...</div>
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-xl font-semibold mb-4">Pedido #{order.numeroOrden}</h2>
            <ul className="divide-y">
              {order.items.map((it) => (
                <li key={it.id} className="py-3 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-light rounded overflow-hidden" />
                  <div className="flex-1">
                    <p className="font-medium">{it.nombre}</p>
                    <p className="text-sm text-gray">Talle {it.talle} · Cant {it.cantidad}{it.color ? ` · ${it.color}` : ''}</p>
                  </div>
                  <div className="font-medium">{formatPrice(it.precioUnitario * it.cantidad)}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(order.total)}</span>
            </div>
            <Button fullWidth onClick={() => router.push('/mis-compras')}>Ver mis compras</Button>
          </div>
        </div>
      ) : (
        <div className="text-gray">No pudimos cargar los detalles del pedido.</div>
      )}
    </div>
  );
}

export default function CheckoutConfirmacionPage() {
  return (
    <Suspense fallback={<div className="container-custom py-16 text-gray">Cargando confirmación…</div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}
