import type { Env, Book, Chapter, BookWithChapters, AgeRange, Genre, Visibility, User, Subscription, SubscriptionStatus, Character } from '../types';

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
  genre?: Genre,
  coverImageUrl?: string,
  coverImageAttribution?: string,
): Promise<Book> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO books (id, user_id, title, description, age_range, genre, visibility, cover_image_url, cover_image_attribution, chapter_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'private', ?, ?, 0, ?, ?)`,
  )
    .bind(id, userId, title, description || null, ageRange, genre || null, coverImageUrl || null, coverImageAttribution || null, now, now)
    .run();

  return {
    id,
    user_id: userId,
    title,
    description: description || null,
    age_range: ageRange,
    genre: genre || null,
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

// ===== SUBSCRIPTIONS =====

export async function getUserBookCount(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM books WHERE user_id = ?',
  )
    .bind(userId)
    .first<{ count: number }>();
  return row?.count || 0;
}

export async function updateUserSubscription(
  env: Env,
  userId: string,
  status: SubscriptionStatus,
  stripeCustomerId?: string,
): Promise<void> {
  if (stripeCustomerId) {
    await env.DB.prepare(
      'UPDATE users SET subscription_status = ?, stripe_customer_id = ?, updated_at = ? WHERE id = ?',
    )
      .bind(status, stripeCustomerId, new Date().toISOString(), userId)
      .run();
  } else {
    await env.DB.prepare(
      'UPDATE users SET subscription_status = ?, updated_at = ? WHERE id = ?',
    )
      .bind(status, new Date().toISOString(), userId)
      .run();
  }
}

export async function upsertSubscription(
  env: Env,
  userId: string,
  stripeSubId: string,
  stripeCustomerId: string,
  status: string,
  periodEnd: string | null,
  cancelAtPeriodEnd: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await env.DB.prepare(
    'SELECT id FROM subscriptions WHERE stripe_subscription_id = ?',
  )
    .bind(stripeSubId)
    .first<{ id: string }>();

  if (existing) {
    await env.DB.prepare(
      'UPDATE subscriptions SET status = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = ? WHERE id = ?',
    )
      .bind(status, periodEnd, cancelAtPeriodEnd ? 1 : 0, now, existing.id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, status, current_period_end, cancel_at_period_end, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(crypto.randomUUID(), userId, stripeSubId, stripeCustomerId, status, periodEnd, cancelAtPeriodEnd ? 1 : 0, now, now)
      .run();
  }
}

export async function getSubscriptionByUserId(env: Env, userId: string): Promise<Subscription | null> {
  return await env.DB.prepare(
    'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
  )
    .bind(userId)
    .first<Subscription>();
}

export async function getUserByStripeCustomerId(env: Env, stripeCustomerId: string): Promise<User | null> {
  return await env.DB.prepare(
    'SELECT * FROM users WHERE stripe_customer_id = ?',
  )
    .bind(stripeCustomerId)
    .first<User>();
}

// ===== PUBLIC =====

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

// ===== CHARACTERS =====

export async function createCharacter(
  env: Env,
  userId: string,
  name: string,
  appearance?: string,
  personality?: string,
  role?: string,
  avatarUrl?: string,
): Promise<Character> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO characters (id, user_id, name, appearance, personality, role, avatar_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, userId, name, appearance || null, personality || null, role || null, avatarUrl || null, now, now)
    .run();

  return {
    id, user_id: userId, name,
    appearance: appearance || null, personality: personality || null,
    role: role || null, avatar_url: avatarUrl || null,
    created_at: now, updated_at: now,
  };
}

export async function getUserCharacters(env: Env, userId: string): Promise<Character[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM characters WHERE user_id = ? ORDER BY name ASC',
  ).bind(userId).all<Character>();
  return result.results;
}

export async function getCharacter(env: Env, characterId: string): Promise<Character | null> {
  return await env.DB.prepare('SELECT * FROM characters WHERE id = ?')
    .bind(characterId).first<Character>();
}

export async function updateCharacter(
  env: Env,
  characterId: string,
  updates: { name?: string; appearance?: string; personality?: string; role?: string; avatar_url?: string },
): Promise<void> {
  const sets: string[] = [];
  const values: (string | null)[] = [];

  if (updates.name !== undefined) { sets.push('name = ?'); values.push(updates.name); }
  if (updates.appearance !== undefined) { sets.push('appearance = ?'); values.push(updates.appearance); }
  if (updates.personality !== undefined) { sets.push('personality = ?'); values.push(updates.personality); }
  if (updates.role !== undefined) { sets.push('role = ?'); values.push(updates.role); }
  if (updates.avatar_url !== undefined) { sets.push('avatar_url = ?'); values.push(updates.avatar_url); }

  if (sets.length === 0) return;

  sets.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(characterId);

  await env.DB.prepare(`UPDATE characters SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...values).run();
}

export async function deleteCharacter(env: Env, characterId: string): Promise<void> {
  await env.DB.prepare('DELETE FROM book_characters WHERE character_id = ?').bind(characterId).run();
  await env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(characterId).run();
}

// ===== BOOK-CHARACTER LINKS =====

export async function setBookCharacters(env: Env, bookId: string, characterIds: string[]): Promise<void> {
  await env.DB.prepare('DELETE FROM book_characters WHERE book_id = ?').bind(bookId).run();
  for (const charId of characterIds) {
    await env.DB.prepare('INSERT INTO book_characters (book_id, character_id) VALUES (?, ?)')
      .bind(bookId, charId).run();
  }
}

export async function getBookCharacters(env: Env, bookId: string): Promise<Character[]> {
  const result = await env.DB.prepare(
    `SELECT c.* FROM characters c
     INNER JOIN book_characters bc ON bc.character_id = c.id
     WHERE bc.book_id = ?
     ORDER BY c.name ASC`,
  ).bind(bookId).all<Character>();
  return result.results;
}
