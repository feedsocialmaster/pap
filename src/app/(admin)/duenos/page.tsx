"use client";
import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';
import { Producto, TipoCalzado } from '@/types';

// Promotion type for admin management
type Promo = { id: string; titulo: string; descripcion: string; imagen: string; imagenMobile?: string; enlace?: string; activo: boolean; orden: number };

export default function DuenosPanel() {
  const { isAuthenticated, user } = useAuthStore();
  const [products, setProducts] = useState<Array<{id:string; nombre:string; stock:number; precio:number}>>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  type OrderVM = { id: string; numeroOrden: string; fecha: string; estado: string; total: number };
  const [orders, setOrders] = useState<OrderVM[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');
  const [orderDetailId, setOrderDetailId] = useState<string | null>(null);
  type OrderDetail = {
    id: string; numeroOrden: string; fecha: string; estado: string; total: number;
    items: Array<{ id: string; productId: string; talle: number; cantidad: number; precioUnitario: number; product?: { nombre?: string } }>;
    usuario?: { nombre?: string; apellido?: string; email?: string };
    payment?: { status?: string; paymentId?: string };
  };
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  type ModalProductState = null | { mode: 'create' } | { mode: 'edit'; productId: string };
  type ModalPromoState = null | { mode: 'create' } | { mode: 'edit'; promo: Promo };
  const [showProductModal, setShowProductModal] = useState<ModalProductState>(null);
  const [showPromoModal, setShowPromoModal] = useState<ModalPromoState>(null);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, promoRes] = await Promise.all([
          axios.get('/products?page=1&pageSize=50'),
          axios.get('/promotions'),
        ]);
        setProducts(pRes.data.data || pRes.data?.data?.data || []);
  setPromos(promoRes.data.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadOrders() {
      setOrdersLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('pageSize', '20');
        if (estadoFiltro) params.set('estado', estadoFiltro);
        const res = await axios.get(`/orders?${params.toString()}`);
        const data: Array<{ id: string; numeroOrden: string; fecha: string; estado: string; total: number }> = res.data?.data || [];
        const mapped: OrderVM[] = data.map((o) => ({
          id: o.id,
          numeroOrden: o.numeroOrden,
          fecha: o.fecha,
          estado: o.estado,
          total: Math.round(o.total) / 100,
        }));
        setOrders(mapped);
      } finally {
        setOrdersLoading(false);
      }
    }
    loadOrders();
  }, [estadoFiltro]);

  useEffect(() => {
    async function loadDetail() {
      if (!orderDetailId) { setOrderDetail(null); return; }
      setOrderLoading(true);
      try {
        const res = await axios.get(`/orders/${orderDetailId}`);
        const d = res.data?.data;
        type ApiOrderItem = { id: string; productId: string; talle: number; cantidad: number; precioUnitario: number; product?: { nombre?: string } };
        const mapped: OrderDetail = {
          id: d.id,
          numeroOrden: d.numeroOrden,
          fecha: d.fecha,
          estado: d.estado,
          total: d.total,
          items: ((d.items as ApiOrderItem[] | undefined) || []).map((it) => ({ id: it.id, productId: it.productId, talle: it.talle, cantidad: it.cantidad, precioUnitario: it.precioUnitario, product: it.product ? { nombre: it.product.nombre } : undefined })),
          usuario: d.usuario,
          payment: d.payment,
        };
        setOrderDetail(mapped);
      } finally {
        setOrderLoading(false);
      }
    }
    loadDetail();
  }, [orderDetailId]);

  if (!isAuthenticated || (user?.role !== 'DUENA' && user?.role !== 'DESARROLLADOR')) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold text-dark mb-4">Acceso restringido</h1>
        <p className="text-gray">Necesitás permisos de dueña para ver este panel.</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-10">
      <h1 className="text-3xl font-bold mb-6">Panel de Dueñas</h1>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-gray-light p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Productos</h2>
              <Button onClick={() => setShowProductModal({ mode: 'create' })}>Agregar producto</Button>
            </div>
            <ul className="divide-y">
              {products.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.nombre}</p>
                    <p className="text-sm text-gray">Stock: {p.stock} · Precio: ${(p.precio/100).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowProductModal({ mode: 'edit', productId: p.id })}>Editar</Button>
                    <Button variant="outline" onClick={async () => {
                      if (!confirm(`Eliminar ${p.nombre}?`)) return;
                      await axios.delete(`/products/${p.id}`);
                      setProducts((prev) => prev.filter((x) => x.id !== p.id));
                    }}>Eliminar</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-gray-light p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Promociones de Inicio</h2>
              <Button onClick={() => setShowPromoModal({ mode: 'create' })}>Nueva promoción</Button>
            </div>
            <ul className="divide-y">
              {promos.map((b) => (
                <li key={b.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.titulo}</p>
                    <p className="text-sm text-gray">Activo: {b.activo ? 'Sí' : 'No'} · Orden: {b.orden}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowPromoModal({ mode: 'edit', promo: b })}>Editar</Button>
                    <Button variant="outline" onClick={async () => {
                      if (!confirm(`Eliminar promoción ${b.titulo}?`)) return;
                      await axios.delete(`/promotions/${b.id}`);
                      setPromos((prev) => prev.filter((x) => x.id !== b.id));
                    }}>Eliminar</Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-gray-light p-5 rounded-xl lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pedidos recientes</h2>
              <select className="input" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
                <option value="">Todos</option>
                <option value="EN_PROCESO">En proceso</option>
                <option value="APPROVED">Aprobados</option>
                <option value="REJECTED">Rechazados</option>
                <option value="ENTREGADO">Entregados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </div>
            {ordersLoading ? (
              <p>Cargando pedidos...</p>
            ) : (
              <ul className="divide-y">
                {orders.map((o) => (
                  <li key={o.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{o.numeroOrden}</p>
                      <p className="text-sm text-gray">{new Date(o.fecha).toLocaleString()} · {o.estado}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-medium">${'{'}o.total.toFixed(2){'}'}</div>
                      <Button variant="outline" onClick={() => setOrderDetailId(o.id)}>Ver detalle</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Modales */}
      {showProductModal && (
        <ProductModal
          mode={showProductModal.mode}
          productId={showProductModal.mode === 'edit' ? showProductModal.productId : undefined}
          onClose={() => setShowProductModal(null)}
          onSaved={(p: Producto) => {
            setShowProductModal(null);
            setProducts((prev) => {
              const idx = prev.findIndex((x) => x.id === p.id);
              if (idx >= 0) { const copy = [...prev]; copy[idx] = p; return copy; }
              return [p, ...prev];
            });
          }}
        />
      )}

      {showPromoModal && (
        <PromoModal
          mode={showPromoModal.mode}
          promo={showPromoModal.mode === 'edit' ? showPromoModal.promo : undefined}
          onClose={() => setShowPromoModal(null)}
          onSaved={(pr: Promo) => {
            setShowPromoModal(null);
            setPromos((prev) => {
              const idx = prev.findIndex((x) => x.id === pr.id);
              if (idx >= 0) { const copy = [...prev]; copy[idx] = pr; return copy; }
              return [pr, ...prev];
            });
          }}
        />
      )}

      {/* Order detail modal */}
      {orderDetailId && (
        <Modal open={true} title={`Pedido #${orderDetail?.numeroOrden || ''}`} onClose={() => setOrderDetailId(null)} widthClassName="max-w-2xl" footer={(
          <Button variant="outline" onClick={() => setOrderDetailId(null)}>Cerrar</Button>
        )}>
          {orderLoading || !orderDetail ? (
            <p className="text-gray">Cargando...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray">{new Date(orderDetail.fecha).toLocaleString()}</div>
                <div className="text-sm"><span className="px-2 py-1 rounded bg-gray-light">{orderDetail.estado}</span></div>
              </div>
              <div className="border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-light text-left">
                      <th className="p-2">Producto</th>
                      <th className="p-2">Talle</th>
                      <th className="p-2">Cant</th>
                      <th className="p-2 text-right">Unitario</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(orderDetail.items || []).map((it) => (
                      <tr key={it.id} className="border-t">
                        <td className="p-2">{it.product?.nombre || it.productId}</td>
                        <td className="p-2">{it.talle}</td>
                        <td className="p-2">{it.cantidad}</td>
                        <td className="p-2 text-right">${'{'}(Math.round(it.precioUnitario)/100).toFixed(2){'}'}</td>
                        <td className="p-2 text-right">${'{'}((Math.round(it.precioUnitario)/100) * it.cantidad).toFixed(2){'}'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray">Cliente: {orderDetail.usuario?.nombre} {orderDetail.usuario?.apellido} ({orderDetail.usuario?.email})</div>
                <div className="text-lg font-semibold">Total: ${'{'}(Math.round(orderDetail.total)/100).toFixed(2){'}'}</div>
              </div>
              <div className="text-sm text-gray">Pago: {orderDetail.payment?.status || 'PENDING'} {orderDetail.payment?.paymentId ? `• MP ${orderDetail.payment.paymentId}` : ''}</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm text-dark mb-1">{label}</span>
      {children}
    </label>
  );
}

function ProductModal({ mode, productId, onClose, onSaved }: { mode: 'create' | 'edit'; productId?: string; onClose: () => void; onSaved: (p: Producto) => void; }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('0');
  const [tipoCalzado, setTipoCalzado] = useState<TipoCalzado>('Zapatillas');
  const [talles, setTalles] = useState('35,36,37,38,39,40');
  const [enLiquidacion, setEnLiquidacion] = useState(false);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Load existing product if edit
  useEffect(() => {
    async function load() {
      if (mode === 'edit' && productId) {
        const res = await axios.get(`/products/${productId}`);
        const p: Producto = res.data?.data;
        setNombre(p.nombre);
        setDescripcion(p.descripcion);
        setPrecio(String(p.precio));
        setStock(String(p.stock));
        setTipoCalzado(p.tipoCalzado as TipoCalzado);
        setTalles((p.talles || []).join(','));
        setEnLiquidacion(!!p.enLiquidacion);
        setPorcentajeDescuento(p.porcentajeDescuento != null ? String(p.porcentajeDescuento) : '');
        const primeraImagen = p.imagenes?.[0];
        const imagenUrl = typeof primeraImagen === 'string'
          ? primeraImagen
          : primeraImagen?.url || '';
        setImageUrl(imagenUrl);
      }
    }
    load();
  }, [mode, productId]);

  async function handleUpload(file: File) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await axios.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const url = res.data?.data?.url as string;
    setImageUrl(url);
  }

  async function submit() {
    setSaving(true);
    try {
      const body: { nombre: string; descripcion: string; precio: number; stock: number; tipoCalzado: string; talles: number[]; enLiquidacion: boolean; porcentajeDescuento?: number; imagenes: { url: string }[] } = {
        nombre,
        descripcion,
        precio: parseFloat(precio || '0'),
        stock: parseInt(stock || '0', 10),
        tipoCalzado,
        talles: talles.split(',').map((n: string) => parseInt(n.trim(), 10)).filter((n: number) => !Number.isNaN(n)),
        enLiquidacion,
        porcentajeDescuento: porcentajeDescuento ? parseInt(porcentajeDescuento, 10) : undefined,
        imagenes: imageUrl ? [{ url: imageUrl }] : [],
      };
      const res = mode === 'create'
        ? await axios.post('/products', body)
        : await axios.put(`/products/${productId!}`, body);
      const saved = res.data?.data;
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={true} title={mode === 'create' ? 'Nuevo producto' : 'Editar producto'} onClose={onClose} footer={(
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </>
    )}>
      <div className="grid grid-cols-1 gap-3">
          <Field label="Nombre"><input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
          <Field label="Descripción"><textarea className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio (ARS)"><input className="input" value={precio} onChange={(e) => setPrecio(e.target.value)} /></Field>
            <Field label="Stock"><input className="input" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de calzado">
              <select className="input" value={tipoCalzado} onChange={(e) => setTipoCalzado(e.target.value as TipoCalzado)}>
                {['Zapatillas','Sandalias','Botas','Stilettos','Chatitas','Plataformas'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Talles (coma)"><input className="input" value={talles} onChange={(e) => setTalles(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={enLiquidacion} onChange={(e) => setEnLiquidacion(e.target.checked)} /> En liquidación</label>
            <Field label="% Descuento"><input className="input" value={porcentajeDescuento} onChange={(e) => setPorcentajeDescuento(e.target.value)} /></Field>
          </div>
          <Field label="Imagen principal">
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
              {imageUrl && <span className="text-sm text-gray">Subida</span>}
            </div>
          </Field>
      </div>
    </Modal>
  );
}

function PromoModal({ mode, promo, onClose, onSaved }: { mode: 'create' | 'edit'; promo?: Promo; onClose: () => void; onSaved: (p: Promo) => void; }) {
  const [titulo, setTitulo] = useState(promo?.titulo || '');
  const [descripcion, setDescripcion] = useState(promo?.descripcion || '');
  const [activo, setActivo] = useState(!!promo?.activo);
  const [orden, setOrden] = useState(promo?.orden?.toString() || '0');
  const [enlace, setEnlace] = useState(promo?.enlace || '');
  const [imagen, setImagen] = useState<string>(promo?.imagen || '');
  const [saving, setSaving] = useState(false);

  async function handleUpload(file: File) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await axios.post('/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const url = res.data?.data?.url as string;
    setImagen(url);
  }

  async function submit() {
    setSaving(true);
    try {
  const body: Promo = { id: promo?.id || '', titulo, descripcion, activo, orden: parseInt(orden||'0',10), enlace: enlace || undefined, imagen, imagenMobile: promo?.imagenMobile } as Promo;
      const res = mode === 'create'
        ? await axios.post('/promotions', body)
        : await axios.put(`/promotions/${promo!.id}`, body);
      const saved = res.data?.data;
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={true} title={mode === 'create' ? 'Nueva promoción' : 'Editar promoción'} onClose={onClose} footer={(
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </>
    )}>
      <div className="grid grid-cols-1 gap-3">
          <Field label="Título"><input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} /></Field>
          <Field label="Descripción"><textarea className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Activo</label>
            <Field label="Orden"><input className="input" value={orden} onChange={(e) => setOrden(e.target.value)} /></Field>
          </div>
          <Field label="Enlace opcional"><input className="input" value={enlace} onChange={(e) => setEnlace(e.target.value)} /></Field>
          <Field label="Imagen">
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => e.target.files && handleUpload(e.target.files[0])} />
              {imagen && <span className="text-sm text-gray">Subida</span>}
            </div>
          </Field>
      </div>
    </Modal>
  );
}
