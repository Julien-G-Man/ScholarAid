'use client';

import { AuthProvider } from '@/context/AuthContext';

/** Wraps the app in all client-side context providers. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
