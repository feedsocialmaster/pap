import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  
  // Páginas estáticas
    // Solo URLs públicas y reales.
    // No incluir rutas no indexables (ej: carrito/checkout/perfil) ni datos mock.
    const staticRoutes = [
      '',
      '/tienda',
      '/privacidad',
      '/blog',
      '/quienes-somos',
      '/contacto',
      '/terminos',
      '/preguntas-frecuentes',
      '/cambios-devoluciones',
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    }));

    return staticRoutes;
}
