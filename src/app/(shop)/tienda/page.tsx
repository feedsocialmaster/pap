import type { Metadata } from 'next';
import TiendaClient from './TiendaClient';
import { Producto, PaginatedResponse } from '@/types';
import { absoluteUrl } from '@/lib/siteUrl';
import { normalizeProductImages } from '@/utils/format';
import { apiBaseUrl } from '@/lib/api';

// TODO: This page uses SSR (Server-Side Rendering) with dynamic filters
// It fetches products on each request for fresh data

export const metadata: Metadata = {
  title: 'Tienda de Calzado Femenino | Zapatillas, Sandalias, Botas - Paso a Paso',
  description: 'Descubrí nuestra colección completa de calzado femenino. Zapatillas, sandalias, botas, stilettos y más. Envío gratis, múltiples talles disponibles. Comprá online ahora.',
  keywords: ['tienda calzado mujer', 'zapatillas femeninas', 'sandalias', 'botas', 'stilettos', 'comprar zapatos online', 'calzado argentina'],
  alternates: { canonical: absoluteUrl('/tienda') },
  openGraph: {
    title: 'Tienda de Calzado Femenino - Paso a Paso',
    description: 'Colección completa de zapatillas, sandalias, botas y más. Envío gratis y múltiples talles.',
    type: 'website',
    url: absoluteUrl('/tienda'),
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tienda de Calzado - Paso a Paso',
    description: 'Descubrí toda nuestra colección de calzado femenino',
  },
};

type ApiProduct = Omit<Producto, 'imagenes'> & { imagenes: Array<string | { url: string }> };

function normalizeProduct(p: ApiProduct): Producto {
  return {
    ...p,
    imagenes: normalizeProductImages(p.imagenes),
  };
}

async function fetchProducts(search: URLSearchParams) {
  try {
    const res = await fetch(`${apiBaseUrl}/products?${search.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      return { productos: [] as Producto[], total: 0, totalPages: 1 };
    }
    const data = (await res.json()) as PaginatedResponse<ApiProduct>;
    const productos = (data.data || []).map(normalizeProduct);
    return {
      productos,
      total: data.total ?? productos.length,
      totalPages: data.totalPages ?? 1,
    };
  } catch {
    return { productos: [] as Producto[], total: 0, totalPages: 1 };
  }
}

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  const page = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1;
  const pageSize = Number(Array.isArray(sp.pageSize) ? sp.pageSize[0] : sp.pageSize) || 10;

  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const passthroughKeys = [
    'tipoCalzado',
    'talle',
    'minPrice',
    'maxPrice',
    'enLiquidacion',
    'search',
    'stockMin',
    'stockMax',
    'sort',
  ] as const;

  for (const key of passthroughKeys) {
    const val = sp[key];
    if (typeof val === 'string' && val.length > 0) params.set(key, val);
  }

  const { productos, total, totalPages } = await fetchProducts(params);

  // JSON-LD CollectionPage structured data
  const jsonLdCollectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Tienda de Calzado Femenino - Paso a Paso Shoes",
    "description": "Colección completa de calzado femenino. Zapatillas, sandalias, botas, stilettos y más.",
    "url": "https://pasoapasoshoes.com/tienda",
    "numberOfItems": total,
    "provider": {
      "@type": "Organization",
      "name": "Paso a Paso Shoes",
      "url": "https://pasoapasoshoes.com"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollectionPage) }}
      />
      <TiendaClient
        initialProductos={productos}
        initialTotal={total}
        initialTotalPages={totalPages}
        initialPage={page}
        initialPageSize={pageSize}
      />
    </>
  );
}
