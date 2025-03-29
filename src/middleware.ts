import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Rutas que deben ser protegidas (requieren autenticación)
  const protectedRoutes = [
    '/admin',
    '/dashboard',
    '/pacientes',
    '/comidas',
    '/ingredientes',
    '/cardapio',
    '/perfil'
  ];

  const path = request.nextUrl.pathname;
  
  // Siempre permitir acceso a /pedidos y sus sub-rutas
  if (path === '/pedidos' || path.startsWith('/pedidos/')) {
    return NextResponse.next();
  }
  
  // Rutas públicas por defecto
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password'
  ];
  
  // Si está en una ruta pública, permitir acceso sin verificar
  if (publicRoutes.some(route => path === route || path.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // Verificar si la ruta actual es protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(route + '/')
  );
  
  if (!isProtectedRoute) {
    // Para rutas que no son ni protegidas ni públicas explícitamente
    return NextResponse.next();
  }
  
  // Obtener el token de autenticación de las cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // Si es una ruta protegida pero no hay token, redirigir al login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }
  
  // Si el usuario está autenticado e intenta acceder a login/register, redirigirlo al dashboard
  if (['/login', '/register'].some(route => path === route)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Para todas las demás rutas, permitir el acceso
  return NextResponse.next();
}

// Configurar en qué rutas se debe ejecutar el middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
