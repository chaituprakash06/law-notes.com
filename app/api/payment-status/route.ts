import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return NextResponse.json({ 
      status: session.status,
      customer_email: session.customer_details?.email 
    });
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}