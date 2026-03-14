import type { Env } from './types';
import { handleGenerate } from './routes/generate';
import { handleGetArticle, handleSuggestions, handleBrowse, handleBrowseCategory } from './routes/article';
import { handleSitemap } from './routes/sitemap';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API routes
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      let response: Response;

      // API routes
      if (path === '/api/generate') {
        response = await handleGenerate(request, env, ctx);
      } else if (path.startsWith('/api/suggestions/')) {
        const parts = path.replace('/api/suggestions/', '').split('/');
        if (parts.length === 2) {
          response = await handleSuggestions(parts[0], parts[1], env);
        } else {
          response = new Response(JSON.stringify({ existing: [], suggested: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } else if (path.startsWith('/api/article/')) {
        const parts = path.replace('/api/article/', '').split('/');
        if (parts.length === 2) {
          response = await handleGetArticle(parts[0], parts[1], env);
        } else {
          response = new Response(JSON.stringify({ error: 'Invalid article path' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } else if (path === '/api/browse') {
        response = await handleBrowse(env);
      } else if (path.startsWith('/api/browse/')) {
        const category = path.replace('/api/browse/', '');
        response = await handleBrowseCategory(category, env);
      } else if (path === '/sitemap.xml') {
        response = await handleSitemap(env);
      } else if (path === '/robots.txt') {
        response = new Response(
          `User-agent: *\nAllow: /\n\nSitemap: https://taleium.com/sitemap.xml`,
          { headers: { 'Content-Type': 'text/plain' } }
        );
      } else {
        // For all other routes, serve the SPA (Cloudflare Pages handles this via [site])
        // In dev, this falls through to Vite; in prod, Cloudflare Pages serves static assets
        return new Response(null, { status: 404 });
      }

      // Add CORS headers to API responses
      if (path.startsWith('/api/')) {
        const headers = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
        return new Response(response.body, {
          status: response.status,
          headers,
        });
      }

      return response;
    } catch (err) {
      console.error('Worker error:', err);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
