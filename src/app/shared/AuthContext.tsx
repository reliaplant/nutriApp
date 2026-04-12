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

const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  userData: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    userData: null,
    loading: true,
  });

  useEffect(() => {
    const auth = authService.getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.getUserData(firebaseUser.uid);
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

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
