import type { Env, User } from '../types';
import { FREE_BOOK_LIMIT, FREE_CHAPTER_LIMIT } from '../types';
import { getSessionUser, getSessionIdFromCookie } from '../services/auth';
import { isValidAgeRange, isValidVisibility } from '../utils/validate';
import {
  createBook,
  getUserBooks,
  getUserBookCount,
  getBookWithChapters,
  updateBook,
  deleteBook,
  addChapter,
  ensureShareToken,
} from '../services/db';
import { generateChapter, generateDirections } from '../services/claude';
import { searchImage } from '../services/wikimedia';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function requireAuth(request: Request, env: Env): Promise<User | Response> {
  const sessionId = getSessionIdFromCookie(request);
  if (!sessionId) return json({ error: 'Not authenticated' }, 401);

  const user = await getSessionUser(env, sessionId);
  if (!user) return json({ error: 'Not authenticated' }, 401);

  return user;
}

export async function handleListBooks(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const books = await getUserBooks(env, auth.id);
  return json({ books });
}

export async function handleCreateBook(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  let body: { title?: string; ageRange?: string; description?: string; coverQuery?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { title, ageRange, description, coverQuery } = body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return json({ error: 'Title is required' }, 400);
  }
  if (!ageRange || !isValidAgeRange(ageRange)) {
    return json({ error: 'Valid age range is required (3-5, 6-8, or 9-12)' }, 400);
  }

  // Free tier: book limit
  if (auth.subscription_status === 'free' || auth.subscription_status === 'cancelled') {
    const count = await getUserBookCount(env, auth.id);
    if (count >= FREE_BOOK_LIMIT) {
      return json({ error: 'Free plan allows 1 book. Upgrade for unlimited stories.', code: 'BOOK_LIMIT_REACHED' }, 403);
    }
  }

  const book = await createBook(env, auth.id, title.trim(), ageRange, description?.trim());

  if (coverQuery && typeof coverQuery === 'string') {
    ctx.waitUntil(
      (async () => {
        try {
          const image = await searchImage(coverQuery);
          if (image) {
            await updateBook(env, book.id, {
              cover_image_url: image.thumbnailUrl,
              cover_image_attribution: image.attribution,
            });
          }
        } catch (err) {
          console.error('Cover image resolution failed:', err);
        }
      })(),
    );
  }

  return json({ book }, 201);
}

export async function handleGetBook(request: Request, env: Env, bookId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const book = await getBookWithChapters(env, bookId);
  if (!book) return json({ error: 'Book not found' }, 404);
  if (book.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  return json({ book });
}

export async function handleUpdateBook(request: Request, env: Env, bookId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const book = await getBookWithChapters(env, bookId);
  if (!book) return json({ error: 'Book not found' }, 404);
  if (book.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  let body: { title?: string; description?: string; visibility?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const updates: { title?: string; description?: string; visibility?: string } = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.visibility !== undefined) {
    if (!isValidVisibility(body.visibility)) {
      return json({ error: 'Invalid visibility (private, public, or link)' }, 400);
    }
    updates.visibility = body.visibility;

    if (body.visibility === 'link' || body.visibility === 'public') {
      await ensureShareToken(env, bookId);
    }
  }

  await updateBook(env, bookId, updates);

  const updated = await getBookWithChapters(env, bookId);
  return json({ book: updated });
}

export async function handleDeleteBook(request: Request, env: Env, bookId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const book = await getBookWithChapters(env, bookId);
  if (!book) return json({ error: 'Book not found' }, 404);
  if (book.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  await deleteBook(env, bookId);
  return json({ ok: true });
}

export async function handleCreateChapter(request: Request, env: Env, bookId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const book = await getBookWithChapters(env, bookId);
  if (!book) return json({ error: 'Book not found' }, 404);
  if (book.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  let body: { prompt?: string };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return json({ error: 'Prompt is required' }, 400);
  }

  // Free tier: chapter limit
  if (auth.subscription_status === 'free' || auth.subscription_status === 'cancelled') {
    if (book.chapters.length >= FREE_CHAPTER_LIMIT) {
      return json({ error: 'Free plan allows 3 chapters per book. Upgrade for unlimited chapters.', code: 'CHAPTER_LIMIT_REACHED' }, 403);
    }
  }

  try {
    const generated = await generateChapter(
      book.title,
      book.age_range,
      book.chapters,
      body.prompt.trim(),
      env.ANTHROPIC_API_KEY,
    );

    const chapter = await addChapter(env, bookId, generated.title, generated.content, body.prompt.trim());
    return json({ chapter }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Chapter generation failed:', message);
    return json({ error: 'Failed to generate chapter. Please try again.' }, 500);
  }
}

export async function handleGetDirections(request: Request, env: Env, bookId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const book = await getBookWithChapters(env, bookId);
  if (!book) return json({ error: 'Book not found' }, 404);
  if (book.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  // Free tier: chapter limit (no point suggesting directions if they can't create more)
  if (auth.subscription_status === 'free' || auth.subscription_status === 'cancelled') {
    if (book.chapters.length >= FREE_CHAPTER_LIMIT) {
      return json({ error: 'Free plan allows 3 chapters per book. Upgrade for unlimited chapters.', code: 'CHAPTER_LIMIT_REACHED' }, 403);
    }
  }

  try {
    const directions = await generateDirections(
      book.title,
      book.age_range,
      book.chapters,
      env.ANTHROPIC_API_KEY,
    );
    return json({ directions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Direction generation failed:', message);
    return json({ error: 'Failed to generate directions. Please try again.' }, 500);
  }
}

export async function handleCreateChapterFromDirection(
  request: Request,
  env: Env,
  bookId: string,
): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const book = await getBookWithChapters(env, bookId);
  if (!book) return json({ error: 'Book not found' }, 404);
  if (book.user_id !== auth.id) return json({ error: 'Not authorised' }, 403);

  let body: { direction?: { summary?: string; preview?: string } };
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!body.direction?.summary || !body.direction?.preview) {
    return json({ error: 'Direction with summary and preview is required' }, 400);
  }

  // Free tier: chapter limit
  if (auth.subscription_status === 'free' || auth.subscription_status === 'cancelled') {
    if (book.chapters.length >= FREE_CHAPTER_LIMIT) {
      return json({ error: 'Free plan allows 3 chapters per book. Upgrade for unlimited chapters.', code: 'CHAPTER_LIMIT_REACHED' }, 403);
    }
  }

  const prompt = `${body.direction.summary}: ${body.direction.preview}`;

  try {
    const generated = await generateChapter(
      book.title,
      book.age_range,
      book.chapters,
      prompt,
      env.ANTHROPIC_API_KEY,
    );

    const chapter = await addChapter(env, bookId, generated.title, generated.content, prompt);
    return json({ chapter }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Chapter generation from direction failed:', message);
    return json({ error: 'Failed to generate chapter. Please try again.' }, 500);
  }
}
