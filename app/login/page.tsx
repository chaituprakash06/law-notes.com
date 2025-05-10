// app/login/page.tsx (or your login component)
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectPath = searchParams?.get('redirect') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('Login successful, user:', data.user?.id);
      
      // Manually ensure the auth token is saved in both localStorage and as a cookie
      if (data.session?.access_token) {
        localStorage.setItem('sb-access-token', data.session.access_token);
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=604800; SameSite=Lax`;
      }
      
      if (data.session?.refresh_token) {
        localStorage.setItem('sb-refresh-token', data.session.refresh_token);
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=604800; SameSite=Lax`;
      }
      
      // Small delay to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check for stored redirect in localStorage first (from cart)
      const storedRedirect = localStorage.getItem('redirectAfterLogin');
      if (storedRedirect) {
        localStorage.removeItem('redirectAfterLogin'); // Clear after use
        router.push(storedRedirect);
      } else {
        // Otherwise use the URL param
        router.push(redirectPath);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-12">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white ${
            loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}