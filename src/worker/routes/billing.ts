import type { Env, SubscriptionStatus } from '../types';
import { getSessionUser, getSessionIdFromCookie } from '../services/auth';
import {
  createCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  getSubscription,
  verifyWebhookSignature,
} from '../services/stripe';
import {
  updateUserSubscription,
  upsertSubscription,
  getSubscriptionByUserId,
  getUserByStripeCustomerId,
} from '../services/db';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function handleCreateCheckout(request: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) return json({ error: 'Not authenticated' }, 401);

  const user = await getSessionUser(env, sessionId);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  // Create Stripe customer if they don't have one
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    customerId = await createCustomer(user.email, user.id, env.STRIPE_SECRET_KEY);
    await updateUserSubscription(env, user.id, user.subscription_status, customerId);
  }

  const origin = new URL(request.url).origin;
  const url = await createCheckoutSession(
    customerId,
    env.STRIPE_PRICE_ID,
    `${origin}/dashboard?upgraded=1`,
    `${origin}/dashboard`,
    env.STRIPE_SECRET_KEY,
  );

  return json({ url });
}

export async function handleBillingPortal(request: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) return json({ error: 'Not authenticated' }, 401);

  const user = await getSessionUser(env, sessionId);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  if (!user.stripe_customer_id) {
    return json({ error: 'No billing account found' }, 403);
  }

  const origin = new URL(request.url).origin;
  const url = await createBillingPortalSession(
    user.stripe_customer_id,
    `${origin}/account`,
    env.STRIPE_SECRET_KEY,
  );

  return json({ url });
}

export async function handleBillingStatus(request: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) return json({ error: 'Not authenticated' }, 401);

  const user = await getSessionUser(env, sessionId);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const subscription = await getSubscriptionByUserId(env, user.id);

  return json({
    status: user.subscription_status,
    currentPeriodEnd: subscription?.current_period_end || null,
    cancelAtPeriodEnd: subscription ? !!subscription.cancel_at_period_end : false,
  });
}

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return json({ error: 'Missing signature' }, 400);
  }

  const valid = await verifyWebhookSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return json({ error: 'Invalid signature' }, 400);
  }

  const event = JSON.parse(body) as {
    type: string;
    data: { object: Record<string, unknown> };
  };

  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const customerId = obj.customer as string;
      const subscriptionId = obj.subscription as string;
      const user = await getUserByStripeCustomerId(env, customerId);
      if (user) {
        let periodEnd: string | null = null;
        try {
          const sub = await getSubscription(subscriptionId, env.STRIPE_SECRET_KEY);
          periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        } catch {
          // Period end will be populated by the subscription.updated webhook
        }
        await updateUserSubscription(env, user.id, 'active');
        await upsertSubscription(env, user.id, subscriptionId, customerId, 'active', periodEnd, false);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const customerId = obj.customer as string;
      const subscriptionId = obj.id as string;
      const status = obj.status as string;
      const periodEnd = obj.current_period_end
        ? new Date((obj.current_period_end as number) * 1000).toISOString()
        : null;
      const cancelAtPeriodEnd = obj.cancel_at_period_end as boolean;

      const user = await getUserByStripeCustomerId(env, customerId);
      if (user) {
        let dbStatus: SubscriptionStatus = 'active';
        if (status === 'past_due') dbStatus = 'past_due';
        else if (status === 'canceled' || status === 'unpaid') dbStatus = 'cancelled';

        await updateUserSubscription(env, user.id, dbStatus);
        await upsertSubscription(env, user.id, subscriptionId, customerId, status, periodEnd, cancelAtPeriodEnd);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const customerId = obj.customer as string;
      const subscriptionId = obj.id as string;

      const user = await getUserByStripeCustomerId(env, customerId);
      if (user) {
        await updateUserSubscription(env, user.id, 'cancelled');
        await upsertSubscription(env, user.id, subscriptionId, customerId, 'canceled', null, false);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const customerId = obj.customer as string;
      const user = await getUserByStripeCustomerId(env, customerId);
      if (user) {
        await updateUserSubscription(env, user.id, 'past_due');
      }
      break;
    }
  }

  return json({ received: true });
}
