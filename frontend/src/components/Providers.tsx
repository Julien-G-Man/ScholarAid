'use client';

import { AuthProvider } from '@/context/AuthContext';
import { MessagingProvider } from '@/context/MessagingContext';
import MessagingWidget from './MessagingWidget';

/** Wraps the app in all client-side context providers. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MessagingProvider>
        {children}
        <MessagingWidget />
      </MessagingProvider>
    </AuthProvider>
  );
}
