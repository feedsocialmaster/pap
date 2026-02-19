import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pasoapasoshoes.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pasoapasoshoes.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.100.80',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.**',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const backendUrl = apiUrl.replace('/api', '');
    
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    // Redirects de URLs antiguas de productos a nuevas URLs con tipo de calzado
    // Las URLs antiguas siguen el formato: /producto/:id o /producto/:slug
    // Las nuevas siguen el formato: /:tipoCalzado/:slug
    // Nota: Los redirects específicos se generan con el script generate-product-redirects.ts
    // Por ahora, manejamos el caso general con middleware
    return [];
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    // Extraer la URL base sin el path /api para permitir todas las rutas
    const apiBaseUrl = apiUrl.replace(/\/api\/?$/, '');
    const wsBaseUrl = apiBaseUrl.replace('http', 'ws');
    
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https: http: data:",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: http: blob: *",
              "font-src 'self' data: https:",
              `connect-src 'self' ${apiBaseUrl} ${wsBaseUrl} http://localhost:* ws://localhost:* https: wss:`,
              "frame-src 'self' https:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "media-src 'self' https: http: data: blob:",
              "worker-src 'self' blob:",
            ].join('; ') + ';',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
