import type { Env, GenerateRequest, CachedArticle } from '../types';
import { isValidReadingLevel } from '../utils/validate';
import { topicToSlug } from '../utils/slug';
import { generateArticle } from '../services/claude';
import { resolveArticleImages } from '../services/wikimedia';
import { getCachedArticle, setCachedArticle, storeMetadata } from '../services/cache';

export async function handleGenerate(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: GenerateRequest;
  try {
    body = await request.json() as GenerateRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { topic, readingLevel } = body;

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Topic is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!readingLevel || !isValidReadingLevel(readingLevel)) {
    return new Response(
      JSON.stringify({ error: 'Invalid reading level. Must be: young-explorer, curious-mind, or deep-dive' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const slug = topicToSlug(topic.trim());
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Could not generate a valid URL from that topic' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check cache first
  const cached = await getCachedArticle(env, slug, readingLevel);
  if (cached) {
    return new Response(
      JSON.stringify({
        slug,
        readingLevel,
        cached: true,
        article: cached,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Generate article text, then resolve images in the background
  try {
    const article = await generateArticle(topic.trim(), readingLevel, env.ANTHROPIC_API_KEY);

    // Save article immediately with placeholder (null) images
    const cachedArticle: CachedArticle = {
      slug,
      readingLevel,
      topic: topic.trim(),
      generatedAt: new Date().toISOString(),
      article,
      images: {
        hero: null,
        sections: article.sections.map(() => null),
      },
    };

    // Store text-only version in KV and D1
    await Promise.all([
      setCachedArticle(env, cachedArticle),
      storeMetadata(env, cachedArticle),
    ]);

    // Resolve images in the background and update KV when done
    if (ctx) {
      ctx.waitUntil(
        (async () => {
          try {
            const sectionQueries = article.sections.map((s) => s.imageQuery);
            const images = await resolveArticleImages(article.heroImageQuery, sectionQueries);
            const withImages: CachedArticle = { ...cachedArticle, images };
            await Promise.all([
              setCachedArticle(env, withImages),
              storeMetadata(env, withImages),
            ]);
            console.log(`Images resolved for: ${slug}/${readingLevel}`);
          } catch (err) {
            console.error('Background image resolution failed:', err);
          }
        })()
      );
    }

    return new Response(
      JSON.stringify({
        slug,
        readingLevel,
        cached: false,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Article generation failed:', message);
    return new Response(
      JSON.stringify({ error: 'Failed to generate article. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
