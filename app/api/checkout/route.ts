import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { CartItem } from '@/lib/stripe';

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
    const lineItems = items.map((item: CartItem) => ({
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
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart?canceled=true`,
      metadata: {
        userId,
        noteIds: items.map((item: CartItem) => item.id).join(','),
      },
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