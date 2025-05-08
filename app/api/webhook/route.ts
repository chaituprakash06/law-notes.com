import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

// This is the Stripe webhook handler for handling payment events
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature') as string;
    
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not set');
    }
    
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      // Get user ID and purchased note IDs from session metadata
      const userId = session.metadata.userId;
      const noteIds = session.metadata.noteIds.split(',');
      
      // Record Stripe payment intent ID for reference
      const paymentIntentId = session.payment_intent;
      
      if (userId && noteIds.length > 0) {
        // Create purchase records for each note
        for (const noteId of noteIds) {
          // Check if purchase already exists to avoid duplicates
          const { data: existingPurchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('note_id', noteId)
            .maybeSingle();
            
          if (!existingPurchase) {
            // Create a new purchase record
            const { error } = await supabase
              .from('purchases')
              .insert({
                user_id: userId,
                note_id: noteId,
                stripe_payment_intent_id: paymentIntentId
              });
              
            if (error) {
              console.error(`Error creating purchase record for note ${noteId}:`, error);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// This is important for Stripe webhook verification
export const dynamic = 'force-dynamic';