'use client';

import { useState } from 'react';
import { Calendar, User, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

export default function BlogListClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts] = useState<BlogPost[]>(initialPosts);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4 text-center">Blog Paso a Paso</h1>
          <p className="text-lg opacity-90 text-center">
            Consejos, tendencias y novedades sobre calzado femenino
          </p>
        </div>
      </header>

      {/* Content */}
      <section className="container mx-auto px-4 py-12" aria-label="Artículos del blog">
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Próximamente nuevos artículos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Estamos preparando contenido interesante para ti</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all overflow-hidden group"
                itemScope
                itemType="http://schema.org/BlogPosting"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  {post.miniatura && (
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={post.miniatura}
                        alt={post.titulo}
                        width={600}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        itemProp="image"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <h2
                      className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors"
                      itemProp="headline"
                    >
                      {post.titulo}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3" itemProp="description">
                      {post.descripcion}
                    </p>

                    <footer className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1" itemProp="author" itemScope itemType="http://schema.org/Person">
                          <User className="w-4 h-4" aria-hidden="true" />
                          <span itemProp="name">{post.autor}</span>
                        </span>
                        <time
                          className="flex items-center gap-1"
                          dateTime={post.publicadoEn}
                          itemProp="datePublished"
                        >
                          <Calendar className="w-4 h-4" aria-hidden="true" />
                          {formatDate(post.publicadoEn)}
                        </time>
                      </div>
                      <span className="flex items-center gap-1" aria-label={`${post.vistas} vistas`}>
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        {post.vistas}
                      </span>
                    </footer>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
