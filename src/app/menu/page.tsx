'use client'

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/app/shared/firebase';
import { useAuth } from '@/app/shared/AuthContext';

const navItems = [
  {
    href: '/pacientes',
    label: 'Pacientes',
    icon: (
      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    matchPaths: ['/pacientes', '/detalle-paciente', '/consulta'],
  },
  {
    href: '/comidas',
    label: 'Comidas',
    icon: (
      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    matchPaths: ['/comidas'],
  },
  {
    href: '/ingredientes',
    label: 'Ingredientes',
    icon: (
      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    matchPaths: ['/ingredientes'],
  },
  {
    href: '/calculadora',
    label: 'Calculadora',
    icon: (
      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h8M10 8v8M14 8v8" />
      </svg>
    ),
    matchPaths: ['/calculadora'],
  },
];

const MenuPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { firebaseUser, userData, loading } = useAuth();

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

  return (
    <div>
      <nav className="bg-white border-b border-gray-200 fixed w-full z-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-10">
            {/* Logo + Nav */}
            <div className="flex items-center">
              <Link href="/pacientes" className="flex-shrink-0 flex items-center">
                <div className="w-6 h-6 bg-emerald-500 rounded-sm flex items-center justify-center">
                  <span className="text-white font-bold text-[11px]">N</span>
                </div>
                <span className="ml-1.5 text-xs font-semibold text-gray-800">
                  NutriApp
                </span>
              </Link>

              {/* Desktop nav */}
              <div className="ml-8 hidden md:flex md:items-center md:space-x-0.5">
                {navItems.map((item) => {
                  const active = isActive(item.matchPaths);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all duration-150 ${
                        active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <span className={active ? 'text-emerald-600' : 'text-gray-300'}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User section */}
            <div className="flex items-center gap-2">
              <span className="hidden md:block text-[11px] text-gray-400">
                {user?.displayName || "Usuario"}
              </span>

              <div className="relative flex-shrink-0" ref={avatarRef}>
                <button
                  type="button"
                  className="flex items-center bg-white rounded-full p-0.5 focus:outline-none transition-all"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                >
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="h-6 w-6 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 bg-emerald-50">
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.displayName || "Usuario"}
                        width={24}
                        height={24}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                        <span className="font-medium text-[10px]">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-1.5 w-48 rounded-sm bg-white border border-gray-200 focus:outline-none z-10 shadow-sm">
                    <div className="py-2 px-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-emerald-50 mr-2 flex-shrink-0">
                          {user?.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.displayName || "Usuario"}
                              width={28}
                              height={28}
                              className="h-full w-full object-cover rounded-full"
                              unoptimized
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full">
                              <span className="font-medium text-[10px]">
                                {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {user?.displayName || "Usuario"}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-0.5">
                      <Link
                        href="/perfil"
                        className="flex items-center px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mi perfil
                      </Link>
                      <button
                        className="w-full flex items-center px-3 py-1.5 text-[11px] text-gray-600 hover:bg-gray-50 transition-colors"
                        onClick={handleLogout}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-gray-100">
          <div className="flex justify-around py-0.5 px-2">
            {navItems.map((item) => {
              const active = isActive(item.matchPaths);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center px-2 py-1 text-[10px] font-medium rounded-sm transition-colors ${
                    active
                      ? 'text-emerald-700'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className={active ? 'text-emerald-600' : 'text-gray-300'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MenuPage;