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

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
        response = await handleSignup(request, env);
      } else if (path === '/api/auth/login' && method === 'POST') {
        response = await handleLogin(request, env);
      } else if (path === '/api/auth/logout' && method === 'POST') {
        response = await handleLogout(request, env);
      } else if (path === '/api/auth/me' && method === 'GET') {
        response = await handleMe(request, env);

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
