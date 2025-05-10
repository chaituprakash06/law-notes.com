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
    const { items, returnUrl, userId } = body;
    
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
    
    // Verify the user exists (using admin/service role)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data, error } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.warn('User verification failed:', error?.message || 'User not found');
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        );
      }
      
      console.log('User verified:', userId);
    } catch (err) {
      console.error('Error verifying user:', err);
      // Continue anyway in production, but for debugging we'll stop here
      return NextResponse.json(
        { error: 'User verification failed' },
        { status: 500 }
      );
    }
    
    // Extract note IDs for metadata
    const noteIds = items.map((item: any) => item.id).join(',');
    
    console.log('Creating checkout session with userId:', userId);
    
    // Format line items for Stripe - fix the description issue
    const lineItems = items.map((item: any) => {
      // Create the basic product data
      const productData: any = {
        name: item.title || 'Law Notes',
      };
      
      // Only add description if it's not empty
      if (item.description && typeof item.description === 'string' && item.description.trim() !== '') {
        productData.description = item.description.trim();
      }
      
      return {
        price_data: {
          currency: 'aud',
          product_data: productData,
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity || 1,
      };
    });
    
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
      metadata: session.metadata
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