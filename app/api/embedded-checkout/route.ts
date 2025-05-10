// app/api/embedded-checkout-direct/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('Received direct checkout request');
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-04-30.basil', 
    });
    
    // Parse the request body
    const body = await request.json();
    const { items, returnUrl, userId, authToken } = body;
    
    // Basic validation
    if (!items?.length) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Do a basic check with the provided auth token if available
    if (authToken) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Verify the user exists in the database
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (error || !data) {
          console.warn('User verification failed:', error?.message || 'User not found');
          // Continue anyway for now, but log the issue
        } else {
          console.log('User verified:', userId);
        }
      } catch (err) {
        console.error('Error verifying user:', err);
        // Continue anyway, don't block the checkout
      }
    }
    
    // Extract note IDs for metadata
    const noteIds = items.map((item: any) => item.id).join(',');
    
    console.log('Creating checkout session with userId:', userId);
    
    // Format line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.title,
          description: item.description || '',
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity || 1,
    }));
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      ui_mode: 'embedded',
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId,
        noteIds,
      },
      customer_creation: 'always',
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