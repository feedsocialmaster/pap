import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/perfil/',
          '/checkout/',
          '/wishlist/',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/perfil/',
          '/checkout/',
          '/wishlist/',
        ],
      },
    ],
    sitemap: 'https://pasoapasoshoes.com/sitemap.xml',
  };
}
