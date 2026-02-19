import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTA: Para autenticación de cliente (SPA con Zustand + localStorage),
// NO debemos proteger rutas en el middleware porque:
// 1. El middleware se ejecuta ANTES de que el cliente hidrate desde localStorage
// 2. Causa redirects incorrectos en F5 porque la cookie puede no estar sincronizada aún
// 3. La protección real debe hacerse en el CLIENTE después de la hidratación
//
// El middleware solo debe manejar:
// - Rutas de autenticación (evitar que usuarios autenticados vean /login)
// - Rutas del CMS (que tienen su propio sistema de auth server-side)

// Rutas de autenticación (redirigir a home si ya está autenticado)
const authRoutes = [
  '/auth/login',
  '/auth/registro',
  '/login',
  '/register'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirect de URLs antiguas de productos (/producto/:id o /producto/:slug)
  // a nuevas URLs con tipo de calzado (/:tipoCalzado/:slug)
  // Nota: El redirect específico se hace en el componente de la página,
  // ya que necesitamos consultar la DB para obtener el tipoCalzado
  // Este middleware solo maneja el caso general para mantener la ruta antigua disponible
  if (pathname.startsWith('/producto/')) {
    // Permitir que la aplicación maneje el redirect dinámicamente
    // basándose en los datos del producto
    return NextResponse.next();
  }
  
  // No aplicar middleware a rutas del CMS (tienen su propio sistema de auth)
  if (pathname.startsWith('/cms')) {
    return NextResponse.next();
  }
  
  // Obtener el estado de autenticación desde las cookies
  const authStateCookie = request.cookies.get('user-auth');
  let isAuthenticated = false;

  if (authStateCookie) {
    try {
      const authState = JSON.parse(authStateCookie.value);
      isAuthenticated = authState.state?.isAuthenticated || false;
      
      // Debug: Log para verificar el estado
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Auth state:', { isAuthenticated, userId: authState.state?.userId, path: pathname });
      }
    } catch (error) {
      console.error('[Middleware] Error parsing auth cookie:', error);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[Middleware] No auth cookie found for path:', pathname);
  }

  // REMOVED: Protección de rutas en middleware
  // La protección ahora se hace en el cliente con el HOC withClientAuth

  // Redirigir usuarios autenticados desde páginas de auth
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      // Verificar si hay un returnUrl
      const returnUrl = request.nextUrl.searchParams.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/')) {
        return NextResponse.redirect(new URL(returnUrl, request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
