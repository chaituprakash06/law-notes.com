// app/api/embedded-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    // Initialize Stripe with your secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16', // Use the latest API version
    });

    // Parse the request body
    const { items, returnUrl } = await request.json();

    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

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