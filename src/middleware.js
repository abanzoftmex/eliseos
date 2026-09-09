import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const isUserPortalRoute = pathname === '/portal' || pathname.startsWith('/portal/');
  const publicRoutes = ['/', '/login'];
  const adminPublicRoutes = ['/', '/login'];
  
  // Rutas de compartir que no requieren autenticación
  const isShareRoute = pathname.startsWith('/compartir/');
  
  // Rutas de fichas públicas que no requieren autenticación
  const isPublicFichaRoute = pathname.startsWith('/f/');
  
  // Obtener el estado de autenticación desde las cookies
  const authToken = request.cookies.get('auth-token')?.value;
  const authRole = request.cookies.get('auth-role')?.value;
  
  // Log para debugging (remover en producción)
  console.log('🔒 Middleware ejecutado:', { 
    pathname, 
    authToken: authToken ? 'presente ✅' : 'ausente ❌',
    authRole: authRole || 'ausente ❌',
    isShareRoute: isShareRoute ? 'SÍ 🔗' : 'NO',
    isPublicFichaRoute: isPublicFichaRoute ? 'SÍ 📄' : 'NO',
    allCookies: request.cookies.getAll().map(c => c.name)
  });
  
  // Permitir acceso a rutas de compartir sin autenticación
  if (isShareRoute) {
    console.log('✅ Permitiendo acceso a ruta pública de compartir:', pathname);
    return NextResponse.next();
  }
  
  // Permitir acceso a fichas públicas sin autenticación
  if (isPublicFichaRoute) {
    console.log('✅ Permitiendo acceso a ficha pública:', pathname);
    return NextResponse.next();
  }
  
  // Si está en una ruta pública y está autenticado, redirigir al dashboard
  if (adminPublicRoutes.includes(pathname) && authToken && authRole) {
    console.log('➡️  Redirigiendo al dashboard desde ruta pública');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Si está en una ruta protegida y NO está autenticado, redirigir al login
  if (!publicRoutes.includes(pathname) && !isUserPortalRoute && !authToken) {
    console.log('➡️  Redirigiendo al login desde ruta protegida');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Proteger rutas financieras exclusivamente para rol admin
  if (pathname.startsWith('/finanzas') && authRole !== 'admin') {
    console.log('⛔ Acceso denegado a Finanzas para rol no-admin:', authRole);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  console.log('✅ Permitiendo acceso a:', pathname);
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
     * - img (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|img).*)',
  ],
};
