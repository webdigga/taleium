const STRIPE_API = 'https://api.stripe.com/v1';

async function stripeRequest(
  path: string,
  secretKey: string,
  body?: Record<string, string>,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${STRIPE_API}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as Record<string, string> | undefined;
    throw new Error(err?.message || `Stripe API error: ${res.status}`);
  }
  return data;
}

export async function createCustomer(
  email: string,
  userId: string,
  secretKey: string,
): Promise<string> {
  const data = await stripeRequest('customers', secretKey, {
    email,
    'metadata[taleium_user_id]': userId,
  });
  return data.id as string;
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  secretKey: string,
): Promise<string> {
  const data = await stripeRequest('checkout/sessions', secretKey, {
    customer: customerId,
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return data.url as string;
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
  secretKey: string,
): Promise<string> {
  const data = await stripeRequest('billing_portal/sessions', secretKey, {
    customer: customerId,
    return_url: returnUrl,
  });
  return data.url as string;
}

export async function verifyWebhookSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = sigHeader.split(',');
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const signature = parts.find((p) => p.startsWith('v1='))?.slice(3);
  if (!timestamp || !signature) return false;

  // Reject if older than 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );

  const expected = [...new Uint8Array(signed)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}
