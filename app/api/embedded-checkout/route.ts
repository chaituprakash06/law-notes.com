// app/api/embedded-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Format the return URL correctly
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const returnUrl = `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

export async function POST(request: Request) {
  try {
    // Initialize Stripe with your secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-04-30.basil', // Use the latest API version
    });

    // Parse the request body
    const { items, returnUrl, userId } = await request.json();

    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!userId) {
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
          description: item.description,
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
      return_url: returnUrl,
      // Add metadata here - crucial for your webhook
      metadata: {
        userId: userId,
        noteIds: noteIds,
      },
      customer_creation: 'always', // Always create a customer
    });

    console.log('Embedded checkout session created:', {
      clientSecret: session.client_secret,
      sessionId: session.id,
      hasMetadata: !!session.metadata,
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