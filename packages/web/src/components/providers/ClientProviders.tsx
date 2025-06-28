'use client';

import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'react-hot-toast';
import { PropsWithChildren } from 'react';

export default function ClientProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      {children}
    </AuthProvider>
  );
} 