// lib/auth-client.ts
'use client';

import { supabase } from './supabase';

export async function checkAuthClientSide() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth check error:', error);
      return { authenticated: false, error: error.message };
    }
    
    if (!data.session) {
      return { authenticated: false };
    }
    
    return { 
      authenticated: true, 
      userId: data.session.user.id,
      email: data.session.user.email
    };
  } catch (error: any) {
    console.error('Unexpected auth check error:', error);
    return { authenticated: false, error: error.message };
  }
}

export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    return { success: !!data.session, error };
  } catch (error: any) {
    return { success: false, error };
  }
}