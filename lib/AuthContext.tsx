'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentSession, signOut } from './supabase';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<{ error: any | null }>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh the user state
  const refreshUser = async () => {
    const { user: currentUser } = await getCurrentSession();
    setUser(currentUser);
  };

  useEffect(() => {
    // Check for an existing session when the provider mounts
    const initializeAuth = async () => {
      setIsLoading(true);
      const { user: currentUser } = await getCurrentSession();
      setUser(currentUser);
      setIsLoading(false);
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
      }
    );

    // Clean up the subscription when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
