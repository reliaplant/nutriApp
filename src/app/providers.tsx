'use client'

import { AuthProvider } from '@/app/shared/AuthContext';
import { AuthGuard } from '@/app/components/AuthGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
