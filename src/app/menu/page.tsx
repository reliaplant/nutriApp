'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/app/shared/firebase';
import { useAuth, hasAdminAccess } from '@/app/shared/AuthContext';
import { useTranslation } from '@/app/shared/useTranslation';
import LanguageSwitcher from '@/app/shared/LanguageSwitcher';
import { Users, Calendar, UtensilsCrossed, Carrot, User, LogOut } from 'lucide-react';

const navItemsBase = [
  { href: '/pacientes',     key: 'patients',      icon: <Users className="h-4 w-4" strokeWidth={1.75} />,           matchPaths: ['/pacientes', '/detalle-paciente', '/consulta', '/antropometria'] },
  { href: '/calendario',    key: 'calendar',      icon: <Calendar className="h-4 w-4" strokeWidth={1.75} />,        matchPaths: ['/calendario'] },
  { href: '/comidas',       key: 'meals',         icon: <UtensilsCrossed className="h-4 w-4" strokeWidth={1.75} />, matchPaths: ['/comidas'] },
  { href: '/ingredientes',  key: 'ingredients',   icon: <Carrot className="h-4 w-4" strokeWidth={1.75} />,          matchPaths: ['/ingredientes'] },
];

const MenuPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { firebaseUser, userData, loading } = useAuth();
  const { t } = useTranslation();

  const navItems = navItemsBase.map(it => ({ ...it, label: t(`nav.${it.key}`) as string }));

  const user = firebaseUser ? {
    displayName: userData?.displayName || firebaseUser.displayName,
    email: firebaseUser.email,
    avatarUrl: userData?.avatarUrl,
  } : null;

  const isActive = (matchPaths: string[]) => {
    return matchPaths.some(path => pathname?.startsWith(path));
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return null;
  }

  // Ocultar menú en consulta y rutas públicas (landing, login, legales, /es, /pt)
  const hiddenRoutes = ['/consulta', '/login', '/politica-privacidad', '/terminos', '/es', '/pt'];
  if (pathname === '/' || hiddenRoutes.some(p => pathname === p || pathname?.startsWith(p + '/'))) {
    return null;
  }

  return (
    <div>
      <nav className="bg-white/90 backdrop-blur-md fixed w-full z-20" style={{ borderBottom: '2px solid #E8E5DE', boxShadow: '0 4px 16px -6px rgba(120, 100, 80, 0.12)' }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-11">
            {/* Logo + Nav */}
            <div className="flex items-center">
              <Link href="/pacientes" className="flex-shrink-0 flex items-center gap-2 group">
                <img src="/icons/refeit-logo.svg" alt="refeit" className="h-7 w-7 transition-transform group-hover:scale-105" />
                <span className="text-[15px] font-semibold tracking-tight text-gray-900 lowercase" style={{ fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
                  refeit
                </span>
              </Link>

              {/* Desktop nav */}
              <div className="ml-10 hidden md:flex md:items-center md:gap-1">
                {navItems.map((item) => {
                  const active = isActive(item.matchPaths);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-1.5 px-3 py-3 text-[12px] font-medium transition-colors duration-150 ${
                        active
                          ? 'text-emerald-700'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <span className={active ? 'text-emerald-700' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                      {item.label}
                      {active && (
                        <span className="absolute left-2 right-2 -bottom-px h-[2px] bg-emerald-600 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User section */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="app" />
              <span className="hidden md:block text-[12px] text-gray-500">
                {user?.displayName || t('nav.user')}
              </span>

              <div className="relative flex-shrink-0" ref={avatarRef}>
                <button
                  type="button"
                  className="flex items-center bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                >
                  <span className="sr-only">{t('nav.openUserMenu')}</span>
                  <div className="h-7 w-7 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid #E8E5DE', backgroundColor: '#F4F2EE' }}>
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.displayName || "Usuario"}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-600">
                        <span className="font-semibold text-[11px]">
                          {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md bg-white focus:outline-none z-10 overflow-hidden" style={{ border: '1px solid #E8E5DE', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.06)' }}>
                    <div className="py-3 px-3" style={{ borderBottom: '1px solid #F0EDE8' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid #E8E5DE', backgroundColor: '#F4F2EE' }}>
                          {user?.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.displayName || "Usuario"}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-600">
                              <span className="font-semibold text-[12px]">
                                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="truncate min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">
                            {user?.displayName || "Usuario"}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      {hasAdminAccess(firebaseUser, userData) && (
                        <Link
                          href="/admin"
                          className="flex items-center px-3 py-2 text-[12px] text-purple-700 hover:bg-[#FAF9F7] transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                          </svg>
                          Admin
                        </Link>
                      )}
                      <Link
                        href="/perfil"
                        className="flex items-center px-3 py-2 text-[12px] text-gray-700 hover:bg-[#FAF9F7] transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t('nav.profile')}
                      </Link>
                      <button
                        className="w-full flex items-center px-3 py-2 text-[12px] text-gray-700 hover:bg-[#FAF9F7] transition-colors"
                        onClick={handleLogout}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden" style={{ borderTop: '1px solid #F0EDE8' }}>
          <div className="flex justify-around py-1 px-2">
            {navItems.map((item) => {
              const active = isActive(item.matchPaths);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                    active
                      ? 'text-emerald-700'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className={active ? 'text-emerald-700' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {/* Spacer para compensar el nav fixed */}
      <div className="h-11" />
    </div>
  );
};

export default MenuPage;