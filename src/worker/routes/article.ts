import type { Env, ReadingLevel } from '../types';
import { isValidReadingLevel } from '../utils/validate';
import { getCachedArticle, incrementViewCount, getRecentArticles, getArticlesByCategory, getRelatedArticles } from '../services/cache';

export async function handleGetArticle(
  slug: string,
  level: string,
  env: Env
): Promise<Response> {
  if (!isValidReadingLevel(level)) {
    return new Response(JSON.stringify({ error: 'Invalid reading level' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const article = await getCachedArticle(env, slug, level as ReadingLevel);
  if (!article) {
    return new Response(JSON.stringify({ error: 'Article not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Increment view count (fire and forget)
  incrementViewCount(env, slug, level as ReadingLevel).catch(() => {});

  return new Response(JSON.stringify(article), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleSuggestions(
  slug: string,
  level: string,
  env: Env
): Promise<Response> {
  if (!isValidReadingLevel(level)) {
    return new Response(JSON.stringify({ error: 'Invalid reading level' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const article = await getCachedArticle(env, slug, level as ReadingLevel);
  if (!article) {
    return new Response(JSON.stringify({ existing: [], suggested: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get existing articles in the same category
  const existing = await getRelatedArticles(
    env,
    article.article.category,
    slug,
    level as ReadingLevel,
    3
  );

  // Fill remaining slots with Claude's furtherReading suggestions
  const remainingSlots = 3 - existing.length;
  const suggested = remainingSlots > 0
    ? article.article.furtherReading.slice(0, remainingSlots)
    : [];

  return new Response(
    JSON.stringify({ existing, suggested }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function handleBrowse(env: Env): Promise<Response> {
  const articles = await getRecentArticles(env, 50);
  return new Response(JSON.stringify({ articles }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleBrowseCategory(
  category: string,
  env: Env
): Promise<Response> {
  const articles = await getArticlesByCategory(env, category);
  return new Response(JSON.stringify({ articles }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
