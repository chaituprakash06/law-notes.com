// app/api/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  console.log('💡 Webhook received at:', new Date().toISOString()); // Log when webhook is called
  
  try {
    // Get request body as raw text for signature verification
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature') as string;
    
    console.log('📝 Stripe signature header present:', !!signature); // Log if signature exists
    
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ ERROR: Stripe webhook secret not set');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // Verify the event with Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('✅ Event successfully constructed:', event.type); // Log successful verification
    } catch (err: any) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`📣 Webhook event type: ${event.type}`);
    console.log('📦 Event data:', JSON.stringify(event.data.object, null, 2)); // Log full event data

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      
      // Get user ID and purchased note IDs from session metadata
      const userId = session.metadata?.userId;
      const noteIdsString = session.metadata?.noteIds;
      const paymentIntentId = session.payment_intent;
      
      console.log('🔍 Session metadata:', {
        userId,
        noteIdsString,
        paymentIntentId,
        sessionId: session.id,
        customer: session.customer,
        customerEmail: session.customer_details?.email
      });
      
      if (!userId || !noteIdsString) {
        console.error('❌ Missing userId or noteIds in session metadata', {
          userId,
          noteIdsString,
          sessionId: session.id
        });
        return NextResponse.json({ received: true, error: 'Missing metadata' });
      }
      
      const noteIds = noteIdsString.split(',');
      console.log(`📚 Processing purchase for user ${userId}, notes: ${noteIds.join(', ')}`);
      
      try {
        // Get current user data
        console.log(`🔍 Fetching profile data for user ${userId}`);
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('purchased_notes, stripe_customer_id')
          .eq('id', userId)
          .single();
        
        if (userError) {
          console.error('❌ Error fetching user profile:', userError);
          return NextResponse.json({ received: true, error: 'User profile fetch error' });
        }
        
        console.log('👤 User data retrieved:', {
          currentPurchasedNotes: userData?.purchased_notes || [],
          currentStripeCustomerId: userData?.stripe_customer_id || 'none'
        });
        
        // Create purchase records for each note
        console.log('📝 Creating purchase records...');
        for (const noteId of noteIds) {
          console.log(`🔖 Processing note ID: ${noteId}`);
          
          // Check if purchase already exists to avoid duplicates
          const { data: existingPurchase, error: checkError } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('note_id', noteId)
            .maybeSingle();
            
          if (checkError) {
            console.error(`❌ Error checking existing purchase for note ${noteId}:`, checkError);
          }
          
          if (existingPurchase) {
            console.log(`ℹ️ Purchase for note ${noteId} already exists, skipping`);
          } else {
            // Create a new purchase record
            const { error: purchaseError } = await supabase
              .from('purchases')
              .insert({
                user_id: userId,
                note_id: noteId,
                stripe_payment_intent_id: paymentIntentId
              });
              
            if (purchaseError) {
              console.error(`❌ Error creating purchase record for note ${noteId}:`, purchaseError);
            } else {
              console.log(`✅ Created purchase record for note ${noteId}`);
            }
          }
        }
        
        // Update user's purchased_notes array
        const currentPurchasedNotes = userData?.purchased_notes || [];
        console.log('🔄 Current purchased notes:', currentPurchasedNotes);
        
        // Use a Set to deduplicate notes
        const newPurchasedNotes = [...new Set([...currentPurchasedNotes, ...noteIds])];
        console.log('🔄 New purchased notes:', newPurchasedNotes);
        
        // Update user profile with purchased notes and stripe customer ID if needed
        const updateData: any = {
          purchased_notes: newPurchasedNotes
        };
        
        // Set stripe_customer_id if it doesn't exist yet and we have a customer ID
        if (!userData?.stripe_customer_id && session.customer) {
          updateData.stripe_customer_id = session.customer;
          console.log(`💳 Setting Stripe customer ID: ${session.customer}`);
        }
        
        console.log('📤 Updating user profile with:', updateData);
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        
        if (updateError) {
          console.error('❌ Error updating user profile with purchased notes:', updateError);
          return NextResponse.json(
            { error: 'Failed to update user profile', details: updateError },
            { status: 500 }
          );
        }
        
        console.log(`✅ Successfully updated profile for user ${userId}, added notes: ${noteIds.join(', ')}`);
      } catch (error: any) {
        console.error('❌ Error processing webhook:', error.message, error.stack);
        return NextResponse.json(
          { error: 'Internal server error', details: error.message },
          { status: 500 }
        );
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    console.log('✅ Webhook processing completed successfully');
    return NextResponse.json({ received: true, success: true });
  } catch (error: any) {
    console.error('❌ Unexpected webhook error:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// This ensures the function is always dynamically evaluated 
// and doesn't get cached between requests
export const dynamic = 'force-dynamic';