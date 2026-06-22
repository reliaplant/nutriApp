'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/app/shared/firebase';
import type { NutritionUser } from '@/app/shared/firebase';

interface AuthState {
  firebaseUser: User | null;
  userData: NutritionUser | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Super-admins por correo (override hardcodeado, sin importar el role en Firestore).
export const SUPER_ADMIN_EMAILS: string[] = ['aegonzalezgiraldo@gmail.com'];

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

export function hasAdminAccess(
  firebaseUser: { email: string | null } | null,
  userData: NutritionUser | null
): boolean {
  if (isSuperAdminEmail(firebaseUser?.email)) return true;
  return userData?.role === 'admin';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    userData: null,
    loading: true,
  });

  useEffect(() => {
    const auth = authService.getAuth();
    // En un registro/login con Google, onAuthStateChanged se dispara ANTES de que
    // se cree el documento del usuario (carrera). Reintentamos para no perder el
    // userData (y por tanto el onboarding) en cuentas recién creadas.
    const fetchUserData = async (uid: string) => {
      for (let i = 0; i < 5; i++) {
        const data = await authService.getUserData(uid);
        if (data) return data;
        await new Promise((r) => setTimeout(r, 400));
      }
      return null;
    };
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await fetchUserData(firebaseUser.uid);
          setState({ firebaseUser, userData, loading: false });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setState({ firebaseUser, userData: null, loading: false });
        }
      } else {
        setState({ firebaseUser: null, userData: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUserData = async () => {
    if (!state.firebaseUser) return;
    try {
      const userData = await authService.getUserData(state.firebaseUser.uid);
      setState((prev) => ({ ...prev, userData }));
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}
