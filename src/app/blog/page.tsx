import { Metadata } from 'next';
import BlogListClient from './BlogListClient';
import { apiBaseUrl } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog - Paso a Paso Shoes | Consejos y Tendencias de Calzado Femenino',
  description: 'Descubrí consejos, tendencias y novedades sobre calzado femenino en nuestro blog. Tips de moda, cuidado del calzado y más.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Blog Paso a Paso Shoes',
    description: 'Consejos, tendencias y novedades sobre calzado femenino.',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary',
    title: 'Blog - Paso a Paso Shoes',
    description: 'Consejos y tendencias de calzado femenino.',
  },
};

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  autor: string;
  miniatura?: string;
  publicadoEn: string;
  vistas: number;
}

async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/cms/blog/publicados`, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await fetchPosts();
  return <BlogListClient initialPosts={posts} />;
}
