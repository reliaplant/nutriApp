'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/app/service/firebase';
import { NoodleBowl, Running, TrashCan } from '@carbon/icons-react';

const MenuPage = () => {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = authService.getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
      if (userAuth) {
        // Get additional user data from Firestore
        try {
          const userData = await authService.getUserData(userAuth.uid);
          setUser({
            ...userAuth,
            displayName: userData?.displayName || userAuth.displayName,
            avatarUrl: userData?.avatarUrl,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to basic auth data
          setUser(userAuth);
        }
      } else {
        setUser(null);
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isUserMenuOpen && !target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  if (loading) {
    return null; // or a minimal loading indicator
  }

  return (
    <div>
      {/* Modern navbar with subtle shadow and better spacing */}
      <nav className="bg-white border-b border-gray-100 fixed w-full z-20 shadow-sm">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            {/* Logo and brand */}
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-medium text-emerald-600">
                  NutriApp
                </span>
              </Link>
              <div className="ml-12 hidden md:flex md:items-center md:space-x-6">
                <Link
                  href="/pacientes"
                  className="group flex items-center px-2 py-1 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-all duration-150 ease-in-out"
                >
                  <svg
                    className="mr-2 h-5 w-5 text-gray-500 group-hover:text-emerald-500 transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="relative">
                    Pacientes
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-200"></span>
                  </span>
                </Link>

                <Link
                  href="/nutricion"
                  className="group flex items-center px-2 py-1 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-all duration-150 ease-in-out"
                >
                  <NoodleBowl size={20} />

                  <span className="ml-2 relative">
                    Recetas
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-200"></span>
                  </span>
                </Link>

                <Link
                  href="/nutricion"
                  className="group flex items-center px-2 py-1 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-all duration-150 ease-in-out"
                >
                  <Running size={20} />

                  <span className="ml-2 relative">
                    Ejercicios
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-200"></span>
                  </span>
                </Link>
              </div>
            </div>

            {/* Navigation links with improved spacing and transitions */}
            <div className="flex items-center">


              {/* User profile with actual user data */}
              <div className="ml-6 relative flex-shrink-0" data-user-menu>
                <button
                  type="button"
                  className="flex items-center space-x-2 bg-white rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-expanded={isUserMenuOpen}
                >
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-emerald-200 flex-shrink-0 bg-emerald-50">
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
                      <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-500">
                        <span className="font-medium text-sm">
                          {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Modern dropdown menu with subtle green shadows */}
                {isUserMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-[0_4px_20px_rgba(16,185,129,0.15)] bg-white focus:outline-none z-10 transform transition-all duration-150 ease-in-out">
                  <div className="py-3 px-4 bg-emerald-50">
                    <div className="flex items-center ">
                    <div className="h-10 w-10 rounded-full overflow-hidden shadow-sm bg-emerald-50 mr-3 flex-shrink-0">
                        {user?.avatarUrl ? (
                        <Image
                        src={user.avatarUrl}
                        alt={user.displayName || "Usuario"}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover rounded-full"
                        style={{ aspectRatio: '1/1' }}
                        unoptimized
                        priority
                        />
                        ) : (
                        <div className="h-full w-full flex items-center justify-center bg-emerald-100 text-emerald-500 rounded-full">
                        <span className="font-medium text-sm">
                        {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U"}
                        </span>
                        </div>
                        )}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-800 truncate">
                      {user?.displayName || "Usuario"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                      </p>
                    </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                    href="/perfil"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50/50 hover:text-emerald-600 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi perfil
                    </Link>
                    <button
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50/50 hover:text-emerald-600 transition-colors"
                    onClick={handleLogout}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Mobile menu button and dropdown menu */}
        <div className="md:hidden border-t border-gray-100">
          <div className="flex justify-between py-2 px-4">
            <Link
              href="/pacientes"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-emerald-50 hover:text-emerald-600"
            >
              <svg
                className="mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Pacientes
            </Link>
            <Link
              href="/nutricion"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-emerald-50 hover:text-emerald-600"
            >
              <svg
                className="mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Nutrición
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MenuPage;