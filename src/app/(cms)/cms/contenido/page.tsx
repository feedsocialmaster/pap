'use client';

import { withCMSProtection } from '@/components/cms/withCMSProtection';
import { CMSLayout } from '@/components/cms/CMSLayout';
import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import Link from 'next/link';
import {
  Home,
  Info,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils/format';

interface ContentItem {
  key: string;
  title: string;
  url: string;
  version: number;
  published: boolean;
  hasContent: boolean;
  updatedAt?: string;
}

const CONTENT_PAGES = [
  {
    key: 'home_body',
    title: 'Medios de Pago y Promociones',
    url: '/',
    href: '/cms/contenido/home',
    icon: Home,
    description: 'Medios de pago disponibles y promociones activas',
  },
];

function ContenidoIndexPage() {
  const [contents, setContents] = useState<Map<string, ContentItem>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/cms/site-content');

      if (response.data.success) {
        const map = new Map<string, ContentItem>();
        response.data.contents.forEach((item: ContentItem) => {
          map.set(item.key, item);
        });
        setContents(map);
      }
    } catch (error) {
      console.error('Error al cargar contenidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-dark dark:text-white">
              Contenido del Sitio
            </h2>
            <p className="text-gray-500 mt-1">
              Administra el contenido de las páginas públicas de la tienda
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium">Edición en tiempo real</p>
              <p className="mt-1">
                Los cambios que realices se guardan con versionado. Podés ver el historial
                de cambios y restaurar versiones anteriores en cualquier momento.
              </p>
            </div>
          </div>
        </div>

        {/* Grid de páginas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Cargando contenidos...</span>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CONTENT_PAGES.map((page) => {
              const content = contents.get(page.key);
              const Icon = page.icon;

              return (
                <div
                  key={page.key}
                  className={cn(
                    'card p-5 hover:shadow-lg transition-shadow',
                    'border border-gray-200 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      {content?.hasContent ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          v{content.version}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <AlertCircle className="w-3 h-3" />
                          Sin contenido
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-dark dark:text-white mb-1">
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {page.description}
                  </p>

                  {content?.updatedAt && (
                    <p className="text-xs text-gray-400 mb-3">
                      Última edición: {formatDate(content.updatedAt)}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-primary flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver
                    </a>
                    <div className="flex-1" />
                    <Link
                      href={page.href}
                      className="btn btn-sm btn-primary flex items-center gap-1"
                    >
                      Editar
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CMSLayout>
  );
}

export default withCMSProtection(ContenidoIndexPage);
