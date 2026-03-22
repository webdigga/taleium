import type { Env, User } from '../types';
import { getSessionUser, getSessionIdFromCookie } from '../services/auth';
import {
  createCharacter,
  getUserCharacters,
  getCharacter,
  updateCharacter,
  deleteCharacter,
} from '../services/db';
import { generateAvatar } from '../services/avatar';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function requirePremium(request: Request, env: Env): Promise<User | Response> {
  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) return json({ error: 'Not authenticated' }, 401);

  const user = await getSessionUser(env, sessionId);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  if (user.subscription_status === 'free' || user.subscription_status === 'cancelled') {
    return json({ error: 'Characters require a Premium subscription', code: 'PREMIUM_REQUIRED' }, 403);
  }

  return user;
}

export async function handleListCharacters(request: Request, env: Env): Promise<Response> {
  const auth = await requirePremium(request, env);
  if (auth instanceof Response) return auth;

  const characters = await getUserCharacters(env, auth.id);
  return json({ characters });
}

export async function handleCreateCharacter(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const auth = await requirePremium(request, env);
  if (auth instanceof Response) return auth;

  let body: { name?: string; appearance?: string; personality?: string; role?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return json({ error: 'Name is required' }, 400);
  }

  const character = await createCharacter(
    env,
    auth.id,
    body.name.trim(),
    body.appearance?.trim(),
    body.personality?.trim(),
    body.role?.trim(),
  );

  // Generate avatar in background
  ctx.waitUntil(
    (async () => {
      try {
        const avatarUrl = await generateAvatar(
          env,
          character.name,
          character.appearance,
          character.personality,
          character.role,
        );
        await updateCharacter(env, character.id, { avatar_url: avatarUrl });
      } catch (err) {
        console.error('Avatar generation failed:', err);
      }
    })(),
  );

  return json({ character }, 201);
}

export async function handleUpdateCharacter(
  request: Request,
  env: Env,
  characterId: string,
  ctx: ExecutionContext,
): Promise<Response> {
  const auth = await requirePremium(request, env);
  if (auth instanceof Response) return auth;

  const character = await getCharacter(env, characterId);
  if (!character) return json({ error: 'Character not found' }, 404);
  if (character.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  let body: { name?: string; appearance?: string; personality?: string; role?: string; regenerateAvatar?: boolean };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const updates: { name?: string; appearance?: string; personality?: string; role?: string } = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.appearance !== undefined) updates.appearance = body.appearance.trim();
  if (body.personality !== undefined) updates.personality = body.personality.trim();
  if (body.role !== undefined) updates.role = body.role.trim();

  await updateCharacter(env, characterId, updates);

  // Regenerate avatar if requested or if appearance changed
  if (body.regenerateAvatar || body.appearance !== undefined) {
    const updated = await getCharacter(env, characterId);
    if (updated) {
      ctx.waitUntil(
        (async () => {
          try {
            const avatarUrl = await generateAvatar(
              env,
              updated.name,
              updated.appearance,
              updated.personality,
              updated.role,
            );
            await updateCharacter(env, characterId, { avatar_url: avatarUrl });
          } catch (err) {
            console.error('Avatar regeneration failed:', err);
          }
        })(),
      );
    }
  }

  const result = await getCharacter(env, characterId);
  return json({ character: result });
}

export async function handleDeleteCharacter(request: Request, env: Env, characterId: string): Promise<Response> {
  const auth = await requirePremium(request, env);
  if (auth instanceof Response) return auth;

  const character = await getCharacter(env, characterId);
  if (!character) return json({ error: 'Character not found' }, 404);
  if (character.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  // Delete avatar from R2 if it exists
  if (character.avatar_url) {
    const key = character.avatar_url.replace('/api/assets/', '');
    try { await env.ASSETS.delete(key); } catch {}
  }

  await deleteCharacter(env, characterId);
  return json({ ok: true });
}

export async function handleRegenerateAvatar(
  request: Request,
  env: Env,
  characterId: string,
): Promise<Response> {
  const auth = await requirePremium(request, env);
  if (auth instanceof Response) return auth;

  const character = await getCharacter(env, characterId);
  if (!character) return json({ error: 'Character not found' }, 404);
  if (character.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  try {
    // Delete old avatar
    if (character.avatar_url) {
      const key = character.avatar_url.replace('/api/assets/', '');
      try { await env.ASSETS.delete(key); } catch {}
    }

    const avatarUrl = await generateAvatar(
      env,
      character.name,
      character.appearance,
      character.personality,
      character.role,
    );
    await updateCharacter(env, characterId, { avatar_url: avatarUrl });

    const updated = await getCharacter(env, characterId);
    return json({ character: updated });
  } catch (err) {
    console.error('Avatar regeneration failed:', err);
    return json({ error: 'Failed to generate avatar. Please try again.' }, 500);
  }
}
