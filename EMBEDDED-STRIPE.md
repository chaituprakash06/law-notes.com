# Embedded Stripe Checkout Implementation

This document explains how to use the embedded Stripe checkout flow in the Law Notes e-commerce application.

## Overview

Unlike the redirect-based Stripe checkout, the embedded checkout flow shows the payment form directly in a modal on your site. This provides a more seamless experience for users as they don't leave your website during the payment process.

## Components and Files

1. **Stripe Client Setup**:
   - `/lib/stripe-client.ts`: Initializes and caches the Stripe client

2. **API Endpoints**:
   - `/app/api/embedded-checkout/route.ts`: Creates Stripe checkout sessions for embedded checkout
   - `/app/api/payment-status/route.ts`: Verifies payment status

3. **UI Components**:
   - `/components/checkout/checkout-modal.tsx`: Modal that contains the embedded Stripe checkout form
   - `/app/checkout/completion/page.tsx`: Page shown after checkout completion

## Environment Variables

Ensure you have the following environment variables set in your `.env.local` file:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Implementation Details

### How the Flow Works

1. User clicks "Proceed to Checkout" on the cart page
2. A modal opens with a loading indicator
3. The application creates a Stripe checkout session
4. Stripe's embedded checkout form loads in the modal
5. User completes payment without leaving the site
6. User is redirected to the completion page based on payment status

### Key Differences from Redirect Checkout

1. **UI Mode**: The checkout session uses `ui_mode: 'embedded'` instead of the default redirect flow
2. **Return URL**: Uses a completion page to check payment status after payment
3. **Modal Integration**: Payment form is displayed in a modal using `EmbeddedCheckoutProvider` and `EmbeddedCheckout` from Stripe

## Testing

1. To test the embedded checkout, use these Stripe test cards:
   - Success card: 4242 4242 4242 4242
   - Decline card: 4000 0000 0000 0002
   - Use any future expiration date and any 3-digit CVC

2. For webhook testing, use the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## Troubleshooting

- If the embedded checkout doesn't appear, check browser console for errors
- Verify that the Stripe publishable key is correctly set in your environment variables
- Make sure the `NEXT_PUBLIC_SITE_URL` environment variable is set to your base URL
- Check that you have installed all required packages: `@stripe/stripe-js` and `@stripe/react-stripe-js`

## Webhook Integration

For production, set up a Stripe webhook to handle successful payments. The webhook endpoint is at `/api/webhooks/stripe`. Configure the following events in your Stripe dashboard:

- `checkout.session.completed`: When a checkout is successful
- `payment_intent.succeeded`: When a payment is processed
- `payment_intent.payment_failed`: When a payment fails

## Next Steps

1. Complete the webhooks integration to grant users access to purchased notes
2. Add analytics to track conversion rates
3. Consider adding payment method storage for returning customers

## Additional Resources

- [Stripe Embedded Checkout Documentation](https://stripe.com/docs/checkout/embedded)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [Webhooks Documentation](https://stripe.com/docs/webhooks)
