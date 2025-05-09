// app/api/embedded-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    console.log('Received embedded checkout request');
    
    // Initialize Stripe with your secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-04-30.basil', // Use the latest API version
    });

    // Parse the request body
    const body = await request.json();
    
    // Log request body without sensitive info
    const { items, returnUrl, userId } = body;
    console.log('Request details:', {
      itemCount: items?.length || 0,
      hasReturnUrl: !!returnUrl,
      hasUserId: !!userId,
    });

    // Validate required fields
    if (!items || !items.length) {
      console.error('No items provided in checkout request');
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.error('Missing userId in checkout request');
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Extract note IDs for metadata
    const noteIds = items.map((item: any) => item.id).join(',');

    console.log('Creating embedded checkout session with data:', {
      userId,
      noteIds,
      itemCount: items.length
    });

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
      // Make sure to include metadata
      metadata: {
        userId: userId,
        noteIds: noteIds,
      },
      customer_creation: 'always', // Always create a customer
    });

    console.log('Embedded checkout session created:', {
      sessionId: session.id,
      hasMetadata: !!session.metadata,
      metadata: JSON.stringify(session.metadata)
    });

    // Verify session has metadata by retrieving it again
    const verifySession = await stripe.checkout.sessions.retrieve(session.id);
    console.log('Verified session metadata:', {
      userId: verifySession.metadata?.userId,
      noteIds: verifySession.metadata?.noteIds,
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