# Testing the Payment Flow

All testing is done in live mode. Use your own card, refund yourself after via the Stripe dashboard.

## Scenarios to Test

### 1. Free tier limits

**Book limit:**
1. Sign up with a new account
2. Create 1 book - should succeed
3. Try to create a second book - should see upgrade prompt on `/create` page
4. On the dashboard, "New Story" button should not appear

**Chapter limit:**
1. With a free account's book, add 3 chapters
2. Try to add a 4th chapter - should see upgrade prompt
3. On `/books/:id`, "Add chapter" button should be hidden, replaced with upgrade prompt
4. Chapter count should show "3/3" in the chapters heading
5. Trying "Suggest story directions" should also be blocked

### 2. Upgrade flow

1. As a free user at the book or chapter limit, click "Upgrade to Premium"
2. Should redirect to Stripe Checkout page
3. Pay with your card
4. Should redirect back to `/dashboard?upgraded=1`
5. Should see green success banner "Welcome to Premium!"
6. Should now be able to create more books and chapters
7. Check Stripe dashboard - customer created, subscription active

### 3. Post-upgrade behaviour

1. After upgrading, create a second book - should work
2. Add more than 3 chapters to a book - should work
3. Visit `/account` - should show "Premium" with "Active" badge
4. Should see renewal date and "Manage billing" button

### 4. Billing portal

1. As a premium user, go to `/account`
2. Click "Manage billing"
3. Should redirect to Stripe Billing Portal
4. Should be able to update payment method
5. Should be able to cancel subscription
6. After cancelling, return to Taleium - subscription should remain active until period end

### 5. Subscription cancellation

1. Cancel via the Billing Portal (set to cancel at period end)
2. Back in Taleium, `/account` should show "Cancels on [date]"
3. User should still have full access until the period ends
4. When Stripe sends `customer.subscription.deleted` (at period end), user status becomes `cancelled`
5. User should then be back to free tier limits

### 6. Payment failure

1. This is hard to test in live mode - skip unless needed
2. In sandbox mode, use Stripe test card `4000 0000 0000 0341` to simulate decline
3. Webhook `invoice.payment_failed` should set status to `past_due`
4. User should still have access (grace period)

### 7. Signup notification

1. Sign up with a new account
2. Check webdigga42@gmail.com for notification email
3. Email should show the new user's name and email

### 8. Dashboard upgrade return

1. Complete a Stripe checkout
2. After redirect to `/dashboard?upgraded=1`, refresh the page
3. User's `subscriptionStatus` should be updated (the AuthContext calls refreshUser on upgraded=1)

## How to Refund Test Payments

1. Go to Stripe dashboard > Payments
2. Find the payment
3. Click "Refund" > Full refund
4. The subscription will be cancelled and the user will revert to free tier (via webhook)

## Webhook Verification

If webhooks aren't working:
1. Check Stripe dashboard > Developers > Webhooks > your endpoint
2. Look at "Recent events" - are they being sent?
3. Check the response status - 200 means success
4. Common issues:
   - Webhook secret mismatch between `.dev.vars`/wrangler secret and Stripe dashboard
   - Endpoint URL wrong (must be https://taleium.com/api/billing/webhook)
   - Events not selected (need all 4)
