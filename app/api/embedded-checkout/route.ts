// app/api/embedded-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('Received embedded checkout request');
    
    // Initialize Stripe with your secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-04-30.basil', // Use the latest API version
    });
    
    // Create a Supabase client to verify the session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check authentication first
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('No valid session:', sessionError?.message || 'Session not found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the authenticated user ID
    const authenticatedUserId = sessionData.session.user.id;
    
    // Parse the request body
    const body = await request.json();
    const { items, returnUrl, userId } = body;
    
    // Validate required fields
    if (!items || !items.length) {
      console.error('No items provided in checkout request');
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }
    
    // Ensure the userId matches the authenticated user
    if (userId && userId !== authenticatedUserId) {
      console.error('User ID mismatch:', { requestUserId: userId, sessionUserId: authenticatedUserId });
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }
    
    // Use the authenticated user ID for the checkout session
    const userIdForCheckout = authenticatedUserId;
    
    // Extract note IDs for metadata
    const noteIds = items.map((item: any) => item.id).join(',');
    
    console.log('Creating checkout with authenticated userId:', userIdForCheckout);
    
    // Format line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'aud', // Adjust as needed
        product_data: {
          name: item.title,
          description: item.description || '',
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    }));
    
    // Create a Checkout Session with the embedded UI mode
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      ui_mode: 'embedded',
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      // Make sure to include metadata with the authenticated user ID
      metadata: {
        userId: userIdForCheckout,
        noteIds,
      },
      customer_creation: 'always', // Always create a customer
    });
    
    console.log('Checkout session created with metadata:', {
      sessionId: session.id,
      metadata: {
        userId: session.metadata?.userId,
        noteIds: session.metadata?.noteIds,
      }
    });
    
    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}