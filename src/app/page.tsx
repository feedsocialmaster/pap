import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { Producto, PaginatedResponse, Banner } from '@/types';
import { getSiteUrl } from '@/lib/siteUrl';
import { normalizeProductImages } from '@/utils/format';
import { apiBaseUrl } from '@/lib/api';

export const metadata: Metadata = {
  alternates: { canonical: getSiteUrl() },
};

type ApiProduct = Omit<Producto, 'imagenes'> & { imagenes: Array<string | { url: string }> };

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function normalizeProduct(p: ApiProduct): Producto {
  return {
    ...p,
    imagenes: normalizeProductImages(p.imagenes),
  };
}

async function fetchProducts(params: Record<string, string>): Promise<Producto[]> {
  const search = new URLSearchParams(params);
  try {
    const res = await fetch(`${apiBaseUrl}/products?${search.toString()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as PaginatedResponse<ApiProduct>;
    return (data.data || []).map(normalizeProduct);
  } catch {
    return [];
  }
}

async function fetchBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/promotions`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const recientesAll = await fetchProducts({ page: '1', pageSize: '100' });
  const liquidacionAll = await fetchProducts({ page: '1', pageSize: '100', enLiquidacion: 'true' });
  const bannersData = await fetchBanners();

  const productosRecientes = shuffleArray(recientesAll).slice(0, 8);
  const productosLiquidacion = shuffleArray(liquidacionAll).slice(0, 4);

  return (
    <HomeClient
      initialProductosRecientes={productosRecientes}
      initialProductosLiquidacion={productosLiquidacion}
      initialBanners={bannersData}
    />
  );
}
