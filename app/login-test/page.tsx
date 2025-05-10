// app/login-test/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginTestPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<any>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [cookieInfo, setCookieInfo] = useState<any>(null);

  // Check current auth state on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Check session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setAuthState({ error: error.message });
        } else {
          setAuthState({
            session: data.session ? {
              expires_at: data.session.expires_at,
              token_type: data.session.token_type,
            } : null,
            user: data.session?.user ? {
              id: data.session.user.id,
              email: data.session.user.email,
            } : null,
          });
          
          setUser(data.session?.user || null);
        }
      } catch (err: any) {
        console.error('Auth check error:', err);
        setAuthState({ error: err.message });
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Check cookies (browser-only)
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      setCookieInfo({
        hasSbAccessToken: !!cookies['sb-access-token'],
        hasSbRefreshToken: !!cookies['sb-refresh-token'],
        allCookieKeys: Object.keys(cookies),
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Update user state
      setUser(data.user);
      
      // Refresh auth state display
      const sessionData = await supabase.auth.getSession();
      setAuthState({
        session: sessionData.data.session ? {
          expires_at: sessionData.data.session.expires_at,
          token_type: sessionData.data.session.token_type,
        } : null,
        user: sessionData.data.session?.user ? {
          id: sessionData.data.session.user.id,
          email: sessionData.data.session.user.email,
        } : null,
      });
      
      // Force page refresh to ensure cookies are properly set
      window.location.reload();
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthState({});
      // Force page refresh to clear cookies
      window.location.reload();
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-12">
      <h1 className="text-2xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Current Auth State:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(authState, null, 2)}
        </pre>
        
        {cookieInfo && (
          <>
            <h2 className="text-lg font-semibold mt-4 mb-2">Cookie Status:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(cookieInfo, null, 2)}
            </pre>
          </>
        )}
      </div>
      
      {user ? (
        <div>
          <p className="mb-4">Logged in as: <strong>{user.email}</strong></p>
          <button 
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">Sign In</h2>
          {loginError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1">Email:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Password:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <button 
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Sign In
            </button>
          </form>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">API Test</h2>
        <button 
          onClick={async () => {
            const response = await fetch('/api/debug/auth');
            const data = await response.json();
            setAuthState({
              ...authState,
              apiTest: data
            });
          }}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Test Auth API
        </button>
      </div>
    </div>
  );
}