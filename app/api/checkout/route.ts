// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { CartItem, NOTE_STRIPE_PRICE_IDS } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Get cart items and user ID from request
    const { items, userId } = await request.json();
    
    if (!items || !items.length || !userId) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Create Stripe line items
    const lineItems = items.map((item: CartItem) => {
      const priceId = NOTE_STRIPE_PRICE_IDS[item.id];
      
      // If we have a price ID for this item, use it directly
      if (priceId) {
        return {
          price: priceId,
          quantity: item.quantity
        };
      }
      
      // Otherwise, create a price on the fly
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            metadata: {
              id: item.id,
            },
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });

    // Extract note IDs for metadata
    const noteIds = items.map((item: CartItem) => item.id).join(',');
    
    console.log('Creating checkout session with data:', {
      userId,
      noteIds,
      itemCount: items.length
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart?canceled=true`,
      metadata: {
        userId: userId,
        noteIds: noteIds,
      },
      customer_creation: 'always', // Always create a customer
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      hasMetadata: !!session.metadata,
      metadata: session.metadata
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}