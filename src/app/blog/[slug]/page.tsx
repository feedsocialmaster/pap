import { Calendar, User, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ShareButtons from './ShareButtons.client';
import { absoluteUrl } from '@/lib/siteUrl';
import { apiBaseUrl } from '@/lib/api';
import { getProductUrl } from '@/utils/format';

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  autor: string;
  miniatura?: string;
  cuerpo: string;
  publicadoEn: string;
  vistas: number;
  palabrasClave: string[];
}

interface RelatedPost {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  miniatura?: string;
  publicadoEn: string;
}

interface Product {
  id: string;
  nombre: string;
  slug: string;  tipoCalzado: string;  precio: number;
  imagenes: { url: string }[];
}

function unwrapApi<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in (json as Record<string, unknown>)) {
    return (json as { data: T }).data;
  }
  return json as T;
}

async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/cms/blog/slug/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return unwrapApi<BlogPost>(json);
  } catch {
    return null;
  }
}

async function fetchRelated(slug: string): Promise<RelatedPost[]> {
  try {
    const res = await fetch(
      `${apiBaseUrl}/cms/blog/slug/${encodeURIComponent(slug)}/relacionados?limit=5`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const json = await res.json();
    const data = unwrapApi<unknown>(json);
    return Array.isArray(data) ? (data as RelatedPost[]) : [];
  } catch {
    return [];
  }
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/products?limit=6`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const data = unwrapApi<unknown>(json);

    if (Array.isArray(data)) return data as Product[];
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.products)) return obj.products as Product[];
      if (Array.isArray(obj.data)) return obj.data as Product[];
    }
    return [];
  } catch {
    return [];
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(price / 100);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, relatedPosts, products] = await Promise.all([
    fetchBlogPost(slug),
    fetchRelated(slug),
    fetchProducts(),
  ]);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Artículo no encontrado</h2>
          <Link href="/blog" className="text-primary hover:underline">
            Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = absoluteUrl(`/blog/${post.slug || slug}`);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog" className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido Principal */}
          <div className="lg:col-span-2">
            <article className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              {post.miniatura && (
                <div className="relative h-96">
                  <Image
                    src={post.miniatura}
                    alt={post.titulo}
                    width={1200}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-8">
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.autor}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.publicadoEn)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.vistas} vistas
                  </span>
                </div>

                {/* Título */}
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  {post.titulo}
                </h1>

                {/* Descripción */}
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  {post.descripcion}
                </p>

                {/* Contenido HTML */}
                <div 
                  className="prose prose-lg max-w-none mb-8 text-gray-800 dark:text-gray-200"
                  dangerouslySetInnerHTML={{ __html: post.cuerpo }}
                />

                {/* Botones de Compartir */}
                <div className="pt-12 mt-8">
                  <div className="flex flex-col items-center justify-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compartir artículo</h3>
                    <ShareButtons url={canonicalUrl} title={post.titulo} />
                  </div>
                </div>
              </div>
            </article>

            {/* Palabras Clave - Fuera del contenedor del artículo */}
            {post.palabrasClave && post.palabrasClave.length > 0 && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {post.palabrasClave.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary/80 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Artículos Relacionados */}
            {relatedPosts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  También pueden interesarte estos recursos...
                </h3>
                <div className="space-y-4">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/blog/${related.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        {related.miniatura && (
                          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={related.miniatura}
                              alt={related.titulo}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                            {related.titulo}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(related.publicadoEn)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Productos Sugeridos */}
            {products.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  ¿Has visto estos productos?
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {products.slice(0, 4).map((product) => (
                    <Link
                      key={product.id}
                      href={getProductUrl(product)}
                      className="group"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                        {product.imagenes && product.imagenes.length > 0 && (
                          <Image
                            src={product.imagenes[0].url}
                            alt={product.nombre}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors line-clamp-2 mb-1">
                        {product.nombre}
                      </h4>
                      <p className="text-sm font-bold text-primary">
                        {formatPrice(product.precio)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
