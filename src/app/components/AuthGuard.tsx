'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, hasAdminAccess } from '@/app/shared/AuthContext';

// Rutas públicas (no requieren sesión). Coincidencia exacta o por prefijo
// para rutas dinámicas como /cuestionarioDieta/[token].
const PUBLIC_PATHS: string[] = [
  '/',
  '/es',
  '/pt',
  '/login',
  '/politica-privacidad',
  '/terminos',
  '/cuestionarioDieta',
];

// Rutas que requieren rol admin
const ADMIN_PATHS: string[] = ['/admin'];

// Ruta de onboarding (excluida del check de onboarding completado)
const ONBOARDING_PATH = '/onboarding';

function matchesAny(pathname: string, list: string[]): boolean {
  if (list.includes(pathname)) return true;
  return list.some((p) => p !== '/' && pathname.startsWith(p + '/'));
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userData, loading } = useAuth();
  const pathname = usePathname() || '/';
  const router = useRouter();

  const isPublic = matchesAny(pathname, PUBLIC_PATHS);
  const isAdminRoute = matchesAny(pathname, ADMIN_PATHS);
  const isOnboardingRoute = pathname === ONBOARDING_PATH;
  const needsOnboarding = !!firebaseUser && !!userData && !userData.onboardingCompletedAt;

  useEffect(() => {
    if (loading) return;
    if (!isPublic && !firebaseUser) {
      router.replace('/login');
      return;
    }
    if (isAdminRoute && firebaseUser && !hasAdminAccess(firebaseUser, userData)) {
      router.replace('/pacientes');
      return;
    }
    if (needsOnboarding && !isOnboardingRoute && !isPublic) {
      router.replace('/onboarding');
      return;
    }
    if (!needsOnboarding && isOnboardingRoute && firebaseUser) {
      router.replace('/pacientes');
    }
  }, [loading, isPublic, isAdminRoute, isOnboardingRoute, needsOnboarding, firebaseUser, userData, router]);

  // Rutas públicas: render directo
  if (isPublic) return <>{children}</>;

  // Rutas privadas: mientras carga sesión o se redirige a /login → spinner
  if (loading || !firebaseUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream-pattern">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  // Ruta admin pero usuario no es admin → spinner mientras redirige
  if (isAdminRoute && !hasAdminAccess(firebaseUser, userData)) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream-pattern">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  // Necesita onboarding y no está en /onboarding → spinner mientras redirige
  if (needsOnboarding && !isOnboardingRoute) {
    return (
      <div className="flex items-center justify-center h-screen bg-cream-pattern">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
