import type { Env } from '../types';
import { getPublicBooks } from '../services/db';

export async function handleSitemap(env: Env): Promise<Response> {
  const books = await getPublicBooks(env);

  const urls = books.map(
    (b) => `  <url>
    <loc>https://taleium.com/shared/${b.share_token}</loc>
    <lastmod>${b.updated_at.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`,
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
