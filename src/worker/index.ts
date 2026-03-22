import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
// @ts-expect-error - injected by wrangler at build time
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import type { Env } from './types';
import { handleSignup, handleLogin, handleLogout, handleMe } from './routes/auth';
import {
  handleListBooks,
  handleCreateBook,
  handleGetBook,
  handleUpdateBook,
  handleDeleteBook,
  handleCreateChapter,
  handleGetDirections,
  handleCreateChapterFromDirection,
} from './routes/books';
import { handlePublicBooks, handlePublicBook, handleSharedBook } from './routes/public';
import { handleSitemap } from './routes/sitemap';
import {
  handleCreateCheckout,
  handleBillingPortal,
  handleBillingStatus,
  handleStripeWebhook,
} from './routes/billing';
import {
  handleListCharacters,
  handleCreateCharacter,
  handleUpdateCharacter,
  handleDeleteCharacter,
  handleRegenerateAvatar,
} from './routes/characters';
import { setBookCharacters, getBookCharacters } from './services/db';
import { getSessionUser, getSessionIdFromCookie } from './services/auth';

const assetManifest = JSON.parse(manifestJSON as string);

async function serveAsset(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    return await getAssetFromKV(
      { request, waitUntil: ctx.waitUntil.bind(ctx) },
      { ASSET_NAMESPACE: (env as unknown as Record<string, unknown>).__STATIC_CONTENT as KVNamespace, ASSET_MANIFEST: assetManifest },
    );
  } catch {
    // SPA fallback: serve index.html for client-side routes
    const indexRequest = new Request(new URL('/index.html', request.url).toString(), request);
    return await getAssetFromKV(
      { request: indexRequest, waitUntil: ctx.waitUntil.bind(ctx) },
      { ASSET_NAMESPACE: (env as unknown as Record<string, unknown>).__STATIC_CONTENT as KVNamespace, ASSET_MANIFEST: assetManifest },
    );
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      let response: Response;

      // Auth routes
      if (path === '/api/auth/signup' && method === 'POST') {
        response = await handleSignup(request, env, ctx);
      } else if (path === '/api/auth/login' && method === 'POST') {
        response = await handleLogin(request, env);
      } else if (path === '/api/auth/logout' && method === 'POST') {
        response = await handleLogout(request, env);
      } else if (path === '/api/auth/me' && method === 'GET') {
        response = await handleMe(request, env);

      // Billing routes
      } else if (path === '/api/billing/checkout' && method === 'POST') {
        response = await handleCreateCheckout(request, env);
      } else if (path === '/api/billing/portal' && method === 'POST') {
        response = await handleBillingPortal(request, env);
      } else if (path === '/api/billing/status' && method === 'GET') {
        response = await handleBillingStatus(request, env);
      } else if (path === '/api/billing/webhook' && method === 'POST') {
        response = await handleStripeWebhook(request, env);

      // Book routes
      } else if (path === '/api/books' && method === 'GET') {
        response = await handleListBooks(request, env);
      } else if (path === '/api/books' && method === 'POST') {
        response = await handleCreateBook(request, env, ctx);
      } else if (/^\/api\/books\/[^/]+$/.test(path) && method === 'GET') {
        const bookId = path.split('/')[3];
        response = await handleGetBook(request, env, bookId);
      } else if (/^\/api\/books\/[^/]+$/.test(path) && method === 'PATCH') {
        const bookId = path.split('/')[3];
        response = await handleUpdateBook(request, env, bookId);
      } else if (/^\/api\/books\/[^/]+$/.test(path) && method === 'DELETE') {
        const bookId = path.split('/')[3];
        response = await handleDeleteBook(request, env, bookId);
      } else if (/^\/api\/books\/[^/]+\/chapters$/.test(path) && method === 'POST') {
        const bookId = path.split('/')[3];
        response = await handleCreateChapter(request, env, bookId);
      } else if (/^\/api\/books\/[^/]+\/directions$/.test(path) && method === 'POST') {
        const bookId = path.split('/')[3];
        response = await handleGetDirections(request, env, bookId);
      } else if (/^\/api\/books\/[^/]+\/chapters\/from-direction$/.test(path) && method === 'POST') {
        const bookId = path.split('/')[3];
        response = await handleCreateChapterFromDirection(request, env, bookId);

      // Book-character linking
      } else if (/^\/api\/books\/[^/]+\/characters$/.test(path) && method === 'GET') {
        const bookId = path.split('/')[3];
        const sessionId = getSessionIdFromCookie(request);
        if (!sessionId) { response = new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } }); }
        else {
          const user = await getSessionUser(env, sessionId);
          if (!user) { response = new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } }); }
          else {
            const characters = await getBookCharacters(env, bookId);
            response = new Response(JSON.stringify({ characters }), { headers: { 'Content-Type': 'application/json' } });
          }
        }
      } else if (/^\/api\/books\/[^/]+\/characters$/.test(path) && method === 'PUT') {
        const bookId = path.split('/')[3];
        const sessionId = getSessionIdFromCookie(request);
        if (!sessionId) { response = new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } }); }
        else {
          const user = await getSessionUser(env, sessionId);
          if (!user) { response = new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } }); }
          else {
            const body = await request.json() as { characterIds?: string[] };
            await setBookCharacters(env, bookId, body.characterIds || []);
            const characters = await getBookCharacters(env, bookId);
            response = new Response(JSON.stringify({ characters }), { headers: { 'Content-Type': 'application/json' } });
          }
        }

      // Character routes
      } else if (path === '/api/characters' && method === 'GET') {
        response = await handleListCharacters(request, env);
      } else if (path === '/api/characters' && method === 'POST') {
        response = await handleCreateCharacter(request, env, ctx);
      } else if (/^\/api\/characters\/[^/]+$/.test(path) && method === 'PATCH') {
        const charId = path.split('/')[3];
        response = await handleUpdateCharacter(request, env, charId, ctx);
      } else if (/^\/api\/characters\/[^/]+$/.test(path) && method === 'DELETE') {
        const charId = path.split('/')[3];
        response = await handleDeleteCharacter(request, env, charId);
      } else if (/^\/api\/characters\/[^/]+\/regenerate-avatar$/.test(path) && method === 'POST') {
        const charId = path.split('/')[3];
        response = await handleRegenerateAvatar(request, env, charId);

      // R2 asset serving (avatars)
      } else if (/^\/api\/assets\//.test(path) && method === 'GET') {
        const key = path.replace('/api/assets/', '');
        const object = await env.ASSETS.get(key);
        if (!object) {
          response = new Response('Not found', { status: 404 });
        } else {
          response = new Response(object.body, {
            headers: {
              'Content-Type': object.httpMetadata?.contentType || 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }

      // Public routes
      } else if (path === '/api/public' && method === 'GET') {
        response = await handlePublicBooks(env);
      } else if (/^\/api\/public\/[^/]+$/.test(path) && method === 'GET') {
        const bookId = path.split('/')[3];
        response = await handlePublicBook(env, bookId);
      } else if (/^\/api\/shared\/[^/]+$/.test(path) && method === 'GET') {
        const token = path.split('/')[3];
        response = await handleSharedBook(env, token);

      // Sitemap & robots
      } else if (path === '/sitemap.xml') {
        response = await handleSitemap(env);
      } else if (path === '/robots.txt') {
        response = new Response(
          `User-agent: *\nAllow: /\n\nSitemap: https://taleium.com/sitemap.xml`,
          { headers: { 'Content-Type': 'text/plain' } },
        );
      } else {
        // Serve static assets (SPA)
        return await serveAsset(request, env, ctx);
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
