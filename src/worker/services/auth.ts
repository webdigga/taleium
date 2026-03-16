import type { Env, User, Session } from '../types';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PBKDF2_ITERATIONS = 100_000;

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );

  return bufferToHex(bits);
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

export async function createUser(
  env: Env,
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const id = crypto.randomUUID();
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, salt, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, email.toLowerCase(), passwordHash, salt, displayName, now, now)
    .run();

  return { id, email: email.toLowerCase(), display_name: displayName, created_at: now, updated_at: now };
}

export async function verifyPassword(
  env: Env,
  email: string,
  password: string,
): Promise<User | null> {
  const row = await env.DB.prepare(
    'SELECT id, email, password_hash, salt, display_name, created_at, updated_at FROM users WHERE email = ?',
  )
    .bind(email.toLowerCase())
    .first<{ id: string; email: string; password_hash: string; salt: string; display_name: string; created_at: string; updated_at: string }>();

  if (!row) return null;

  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) return null;

  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function createSession(env: Env, userId: string): Promise<Session> {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  )
    .bind(id, userId, now.toISOString(), expiresAt.toISOString())
    .run();

  return {
    id,
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
}

export async function getSessionUser(env: Env, sessionId: string): Promise<User | null> {
  const row = await env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > ?`,
  )
    .bind(sessionId, new Date().toISOString())
    .first<User>();

  return row || null;
}

export async function deleteSession(env: Env, sessionId: string): Promise<void> {
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

export function getSessionIdFromCookie(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const match = cookie.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

export function setSessionCookie(sessionId: string): string {
  return `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
