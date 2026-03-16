import type { Env } from '../types';
import {
  createUser,
  verifyPassword,
  createSession,
  getSessionUser,
  deleteSession,
  getSessionIdFromCookie,
  setSessionCookie,
  clearSessionCookie,
} from '../services/auth';

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export async function handleSignup(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { email?: string; password?: string; displayName?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { email, password, displayName } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return json({ error: 'Valid email is required' }, 400);
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return json({ error: 'Password must be at least 8 characters' }, 400);
  }
  if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
    return json({ error: 'Display name is required' }, 400);
  }

  try {
    const user = await createUser(env, email, password, displayName.trim());
    const session = await createSession(env, user.id);

    return json(
      { user: { id: user.id, email: user.email, displayName: user.display_name } },
      201,
      { 'Set-Cookie': setSessionCookie(session.id) },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('UNIQUE constraint failed')) {
      return json({ error: 'An account with this email already exists' }, 409);
    }
    throw err;
  }
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { email, password } = body;

  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const user = await verifyPassword(env, email, password);
  if (!user) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const session = await createSession(env, user.id);

  return json(
    { user: { id: user.id, email: user.email, displayName: user.display_name } },
    200,
    { 'Set-Cookie': setSessionCookie(session.id) },
  );
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromCookie(request);
  if (sessionId) {
    await deleteSession(env, sessionId);
  }

  return json(
    { ok: true },
    200,
    { 'Set-Cookie': clearSessionCookie() },
  );
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) return json({ error: 'Not authenticated' }, 401);

  const user = await getSessionUser(env, sessionId);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  return json({ user: { id: user.id, email: user.email, displayName: user.display_name } });
}
