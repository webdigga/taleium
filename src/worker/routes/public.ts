import type { Env } from '../types';
import { getPublicBooks, getBookByShareToken, getPublicBook, getBookCharacters } from '../services/db';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function handlePublicBooks(env: Env): Promise<Response> {
  const books = await getPublicBooks(env);
  return json({ books });
}

export async function handlePublicBook(env: Env, bookId: string): Promise<Response> {
  const book = await getPublicBook(env, bookId);
  if (!book) return json({ error: 'Book not found' }, 404);
  const characters = await getBookCharacters(env, bookId);
  return json({ book, characters });
}

export async function handleSharedBook(env: Env, token: string): Promise<Response> {
  const book = await getBookByShareToken(env, token);
  if (!book) return json({ error: 'Book not found' }, 404);
  const characters = await getBookCharacters(env, book.id);
  return json({ book, characters });
}
