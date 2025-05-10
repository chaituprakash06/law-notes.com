// app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Get session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return NextResponse.json({
        authenticated: false,
        error: error.message
      }, { status: 401 });
    }
    
    if (!data.session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No active session'
      }, { status: 401 });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}