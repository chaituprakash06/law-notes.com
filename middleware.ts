// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Skip during development for login-test page
  if (request.nextUrl.pathname.startsWith('/login-test')) {
    return NextResponse.next();
  }

  // Create a Supabase client for auth checks with environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Log cookies for debugging (in production you would remove this)
  console.log('Middleware cookies:', request.cookies.getAll().map(c => c.name));

  try {
    // Get the user's session from the request cookie
    const { data: { session } } = await supabase.auth.getSession();

    // Log session info for debugging
    console.log('Middleware session check:', { 
      hasSession: !!session,
      path: request.nextUrl.pathname
    });

    // Define protected routes that require authentication
    const protectedRoutes = ['/dashboard'];
    const protectedApiRoutes = ['/api/embedded-checkout'];
    
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    
    const isProtectedApiRoute = protectedApiRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );

    // Check for authentication
    if ((isProtectedRoute || isProtectedApiRoute) && !session) {
      // For API routes, return a JSON error response
      if (isProtectedApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Authentication required' }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      // For normal routes, redirect to login page with the return URL
      const returnUrl = encodeURIComponent(request.nextUrl.pathname);
      const redirectUrl = new URL(`/login?redirect=${returnUrl}`, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue to the requested page if there's an error in the middleware
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    // Protected routes
    '/dashboard/:path*',
    '/api/embedded-checkout', 
    // Don't add checkout routes here during debugging
    // '/checkout/:path*',
    // Login/register routes for auth state detection
    '/login',
    '/register',
    '/login-test',
  ],
};