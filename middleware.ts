import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Create a Supabase client for auth checks with environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get the user's session from the request cookie
  const { data: { session } } = await supabase.auth.getSession();

  // Define protected routes that require authentication
  const protectedRoutes = ['/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  // Check for authentication
  if (isProtectedRoute && !session) {
    // Redirect to login page with the return URL
    const returnUrl = encodeURIComponent(request.nextUrl.pathname);
    const redirectUrl = new URL(`/login?redirect=${returnUrl}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Auth routes should redirect to dashboard if user is already logged in
  const authRoutes = ['/login', '/register'];
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && session && !request.nextUrl.searchParams.get('redirect')) {
    // Redirect to dashboard if already authenticated and not coming from a redirect
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    // Protect these routes
    '/dashboard/:path*',
    // Optional protection for these routes
    '/login',
    '/register',
  ],
};
