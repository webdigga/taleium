import type { Env } from '../types';

export async function sendSignupNotification(
  env: Env,
  userEmail: string,
  displayName: string,
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Taleium <noreply@mail.kabooly.com>',
        to: [env.NOTIFY_EMAIL],
        subject: `New Taleium signup: ${displayName}`,
        text: `New user registered on Taleium.\n\nName: ${displayName}\nEmail: ${userEmail}\nTime: ${new Date().toISOString()}`,
      }),
    });
  } catch (err) {
    console.error('Signup notification failed:', err);
  }
}
