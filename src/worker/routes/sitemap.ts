import type { Env } from '../types';
import { getAllArticlesForSitemap } from '../services/cache';

export async function handleSitemap(env: Env): Promise<Response> {
  const articles = await getAllArticlesForSitemap(env);

  const urls = articles.map(
    (a) => `  <url>
    <loc>https://taleium.com/${a.slug}/${a.reading_level}</loc>
    <lastmod>${a.generated_at.split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://taleium.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://taleium.com/browse</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}
