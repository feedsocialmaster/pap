import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absoluteUrl } from '@/lib/siteUrl';
import type { Producto } from '@/types';
import ProductoClient from './ProductoClient';
import { apiBaseUrl } from '@/lib/api';
import { getProductUrl } from '@/utils/format';

// TODO: This page uses SSR (Server-Side Rendering) for individual product pages
// Fetches fresh product data on each request for up-to-date stock/pricing

async function fetchProducto(slug: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/products/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data as Producto;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ tipoCalzado: string; slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const producto = await fetchProducto(slug);

  const canonical = producto ? absoluteUrl(getProductUrl(producto)) : absoluteUrl(`/${(await params).tipoCalzado}/${slug}`);

  if (!producto) {
    return {
      title: 'Producto no encontrado | Paso a Paso',
      alternates: { canonical },
    };
  }

  const title = `${producto.nombre} - ${producto.tipoCalzado} | Paso a Paso`;
  const description = producto.descripcion 
    ? `${producto.descripcion.slice(0, 140)} | Comprá online con envío gratis.`
    : `Comprá ${producto.nombre} en Paso a Paso. ${producto.tipoCalzado} de calidad. Envío gratis. Stock disponible: ${producto.stock} unidades.`;

  // Obtener la primera imagen (puede ser string o objeto)
  const primeraImagen = producto.imagenes?.length 
    ? (typeof producto.imagenes[0] === 'string' 
        ? producto.imagenes[0] 
        : (producto.imagenes[0] as { url: string }).url)
    : undefined;

  return {
    title,
    description,
    keywords: [
      producto.nombre,
      producto.tipoCalzado,
      'calzado femenino',
      'comprar online',
      'envío gratis',
      ...(producto.enLiquidacion ? ['liquidación', 'oferta', 'descuento'] : []),
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      locale: 'es_AR',
      images: primeraImagen ? [{ 
        url: primeraImagen,
        alt: `${producto.nombre} - ${producto.tipoCalzado}`,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primeraImagen ? [primeraImagen] : undefined,
    },
  };
}

export default async function ProductoPage(
  { params }: { params: Promise<{ tipoCalzado: string; slug: string }> }
) {
  const { slug } = await params;
  const producto = await fetchProducto(slug);

  if (!producto) notFound();

  return <ProductoClient producto={producto} />;
}
