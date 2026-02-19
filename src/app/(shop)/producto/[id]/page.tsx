import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { apiBaseUrl } from '@/lib/api';
import { tipoCalzadoToSlug } from '@/utils/format';

// Componente para manejar redirects de URLs antiguas
// /producto/:id → /:tipoCalzado/:slug

interface ProductoRedirect {
  id: string;
  slug: string;
  tipoCalzado: string;
}

async function fetchProducto(idOrSlug: string): Promise<ProductoRedirect | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/products/${encodeURIComponent(idOrSlug)}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data as ProductoRedirect;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Redirigiendo... | Paso a Paso',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProductoRedirectPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const producto = await fetchProducto(id);

  if (!producto) {
    // Si no se encuentra el producto, redirigir a la tienda
    redirect('/tienda');
  }

  // Redirigir a la nueva URL con tipo de calzado
  const tipoSlug = tipoCalzadoToSlug(producto.tipoCalzado);
  redirect(`/${tipoSlug}/${producto.slug}`);
}

