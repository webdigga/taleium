import type { CachedArticle, Env, ReadingLevel, ArticleMetadata } from '../types';

function kvKey(slug: string, level: ReadingLevel): string {
  return `article:${slug}:${level}`;
}

export async function getCachedArticle(
  env: Env,
  slug: string,
  level: ReadingLevel
): Promise<CachedArticle | null> {
  const data = await env.ARTICLE_CACHE.get(kvKey(slug, level), 'json');
  return data as CachedArticle | null;
}

export async function setCachedArticle(
  env: Env,
  article: CachedArticle
): Promise<void> {
  await env.ARTICLE_CACHE.put(
    kvKey(article.slug, article.readingLevel),
    JSON.stringify(article)
  );
}

export async function storeMetadata(
  env: Env,
  article: CachedArticle
): Promise<void> {
  await env.DB.prepare(
    `INSERT OR REPLACE INTO articles (slug, reading_level, topic, title, summary, category, era, hero_image_url, generated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      article.slug,
      article.readingLevel,
      article.topic,
      article.article.title,
      article.article.summary,
      article.article.category,
      article.article.era || null,
      article.images.hero?.thumbnailUrl || null,
      article.generatedAt
    )
    .run();
}

export async function incrementViewCount(
  env: Env,
  slug: string,
  level: ReadingLevel
): Promise<void> {
  await env.DB.prepare(
    'UPDATE articles SET view_count = view_count + 1 WHERE slug = ? AND reading_level = ?'
  )
    .bind(slug, level)
    .run();
}

export async function getRecentArticles(
  env: Env,
  limit = 12
): Promise<ArticleMetadata[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM articles ORDER BY generated_at DESC LIMIT ?'
  )
    .bind(limit)
    .all<ArticleMetadata>();
  return result.results;
}

export async function getArticlesByCategory(
  env: Env,
  category: string,
  limit = 50
): Promise<ArticleMetadata[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM articles WHERE category = ? ORDER BY generated_at DESC LIMIT ?'
  )
    .bind(category, limit)
    .all<ArticleMetadata>();
  return result.results;
}

export async function getRelatedArticles(
  env: Env,
  category: string,
  excludeSlug: string,
  readingLevel: ReadingLevel,
  limit = 3
): Promise<ArticleMetadata[]> {
  const result = await env.DB.prepare(
    'SELECT * FROM articles WHERE category = ? AND slug != ? AND reading_level = ? ORDER BY view_count DESC, generated_at DESC LIMIT ?'
  )
    .bind(category, excludeSlug, readingLevel, limit)
    .all<ArticleMetadata>();
  return result.results;
}

export async function getAllArticlesForSitemap(
  env: Env
): Promise<ArticleMetadata[]> {
  const result = await env.DB.prepare(
    'SELECT slug, reading_level, generated_at FROM articles ORDER BY generated_at DESC'
  ).all<ArticleMetadata>();
  return result.results;
}
