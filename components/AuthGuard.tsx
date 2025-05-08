'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is loaded and user is not authenticated, redirect to login
    if (!isLoading && !user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, isLoading, router]);

  // Show loading or fallback while checking authentication
  if (isLoading) {
    return fallback || <div className="p-8 text-center">Checking authentication...</div>;
  }

  // If user is authenticated, render children
  return user ? <>{children}</> : <>{fallback}</>;
}
