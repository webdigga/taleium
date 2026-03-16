import type { Env, Book, Chapter, BookWithChapters, AgeRange, Visibility } from '../types';

function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

// ===== BOOKS =====

export async function createBook(
  env: Env,
  userId: string,
  title: string,
  ageRange: AgeRange,
  description?: string,
  coverImageUrl?: string,
  coverImageAttribution?: string,
): Promise<Book> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO books (id, user_id, title, description, age_range, visibility, cover_image_url, cover_image_attribution, chapter_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'private', ?, ?, 0, ?, ?)`,
  )
    .bind(id, userId, title, description || null, ageRange, coverImageUrl || null, coverImageAttribution || null, now, now)
    .run();

  return {
    id,
    user_id: userId,
    title,
    description: description || null,
    age_range: ageRange,
    visibility: 'private' as Visibility,
    share_token: null,
    cover_image_url: coverImageUrl || null,
    cover_image_attribution: coverImageAttribution || null,
    chapter_count: 0,
    created_at: now,
    updated_at: now,
  };
}

export async function getUserBooks(env: Env, userId: string): Promise<Book[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM books WHERE user_id = ? ORDER BY updated_at DESC',
  )
    .bind(userId)
    .all<Book>();
  return result.results;
}

export async function getBook(env: Env, bookId: string): Promise<Book | null> {
  return await env.DB.prepare('SELECT * FROM books WHERE id = ?')
    .bind(bookId)
    .first<Book>();
}

export async function getBookWithChapters(env: Env, bookId: string): Promise<BookWithChapters | null> {
  const book = await getBook(env, bookId);
  if (!book) return null;

  const chapters = await env.DB.prepare(
    'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC',
  )
    .bind(bookId)
    .all<Chapter>();

  return { ...book, chapters: chapters.results };
}

export async function updateBook(
  env: Env,
  bookId: string,
  updates: { title?: string; description?: string; visibility?: string; cover_image_url?: string; cover_image_attribution?: string },
): Promise<void> {
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (updates.title !== undefined) { sets.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { sets.push('description = ?'); values.push(updates.description); }
  if (updates.visibility !== undefined) { sets.push('visibility = ?'); values.push(updates.visibility); }
  if (updates.cover_image_url !== undefined) { sets.push('cover_image_url = ?'); values.push(updates.cover_image_url); }
  if (updates.cover_image_attribution !== undefined) { sets.push('cover_image_attribution = ?'); values.push(updates.cover_image_attribution); }

  if (sets.length === 0) return;

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(bookId);

  await env.DB.prepare(`UPDATE books SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function ensureShareToken(env: Env, bookId: string): Promise<string> {
  const book = await getBook(env, bookId);
  if (book?.share_token) return book.share_token;

  const token = generateShareToken();
  await env.DB.prepare('UPDATE books SET share_token = ? WHERE id = ?')
    .bind(token, bookId)
    .run();
  return token;
}

export async function deleteBook(env: Env, bookId: string): Promise<void> {
  await env.DB.prepare('DELETE FROM chapters WHERE book_id = ?').bind(bookId).run();
  await env.DB.prepare('DELETE FROM books WHERE id = ?').bind(bookId).run();
}

// ===== CHAPTERS =====

export async function addChapter(
  env: Env,
  bookId: string,
  title: string,
  content: string,
  userPrompt: string | null,
): Promise<Chapter> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM chapters WHERE book_id = ?',
  )
    .bind(bookId)
    .first<{ count: number }>();

  const chapterNumber = (countRow?.count || 0) + 1;

  await env.DB.prepare(
    `INSERT INTO chapters (id, book_id, chapter_number, title, content, user_prompt, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, bookId, chapterNumber, title, content, userPrompt, now)
    .run();

  await env.DB.prepare(
    'UPDATE books SET chapter_count = ?, updated_at = ? WHERE id = ?',
  )
    .bind(chapterNumber, now, bookId)
    .run();

  return {
    id,
    book_id: bookId,
    chapter_number: chapterNumber,
    title,
    content,
    user_prompt: userPrompt,
    created_at: now,
  };
}

// ===== PUBLIC =====

export async function getPublicBooks(env: Env, limit = 50): Promise<Book[]> {
  const result = await env.DB.prepare(
    "SELECT * FROM books WHERE visibility = 'public' ORDER BY updated_at DESC LIMIT ?",
  )
    .bind(limit)
    .all<Book>();
  return result.results;
}

export async function getBookByShareToken(env: Env, token: string): Promise<BookWithChapters | null> {
  const book = await env.DB.prepare(
    "SELECT * FROM books WHERE share_token = ? AND visibility IN ('link', 'public')",
  )
    .bind(token)
    .first<Book>();

  if (!book) return null;

  const chapters = await env.DB.prepare(
    'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC',
  )
    .bind(book.id)
    .all<Chapter>();

  return { ...book, chapters: chapters.results };
}

export async function getPublicBook(env: Env, bookId: string): Promise<BookWithChapters | null> {
  const book = await env.DB.prepare(
    "SELECT * FROM books WHERE id = ? AND visibility = 'public'",
  )
    .bind(bookId)
    .first<Book>();

  if (!book) return null;

  const chapters = await env.DB.prepare(
    'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC',
  )
    .bind(book.id)
    .all<Chapter>();

  return { ...book, chapters: chapters.results };
}
