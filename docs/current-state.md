# Current State (2026-03-16)

## Pivot Complete: Education Articles → Family Story Creator

Taleium has been pivoted from an AI-powered educational article platform to a **collaborative family story creation tool**. Parents and children sit together, create stories chapter by chapter, and build their own books.

## What's Working

### Backend
- **Auth system** — Email + password signup/login, PBKDF2 hashing (100k iterations, Web Crypto API), HttpOnly session cookies (30 days), session validation
- **Book CRUD** — Create, list, get, update, delete books with age range, visibility, and cover images
- **Chapter generation** — AI writes chapters from user prompts, with story context compression (full first + last chapter, excerpts of middle)
- **Direction suggestions** — AI suggests 2-3 meaningfully different story directions to pick from
- **Visibility system** — Per-book private/public/shareable-link with auto-generated share tokens
- **Public/shared routes** — Browse public books, read shared books without auth
- **Cover images** — Wikimedia Commons integration (reused from education version), resolved in background via `ctx.waitUntil()`
- **Sitemap** — Updated for public books

### Frontend
- **Auth flow** — Sign up, log in, sign out with auth-aware header navigation
- **Dashboard** — "My Books" grid with book cards showing cover, title, age range, chapter count
- **Book creation** — Title, description, age range picker, optional cover image search
- **Book workshop** — Chapter list, add chapter, visibility settings, read story
- **Story creation** — Write a prompt OR pick from AI-suggested directions, loading animation during generation
- **Chapter reader** — Sequential reading view with chapter headings and content
- **Shared/public views** — Read-only views for shared and public books
- **Browse page** — Public books grid
- **Mobile-responsive design** — All pages work on mobile

### D1 Schema (migration 002)
- `users` — id, email, password_hash, salt, display_name, timestamps
- `sessions` — id, user_id, created_at, expires_at
- `books` — id, user_id, title, description, age_range, visibility, share_token, cover_image, chapter_count, timestamps
- `chapters` — id, book_id, chapter_number, title, content, user_prompt, created_at

## Not Yet Done

### Production Deployment
- Run migration: `wrangler d1 execute taleium-meta --file=./migrations/002_pivot.sql`
- Ensure `ANTHROPIC_API_KEY` secret is set: `wrangler secret put ANTHROPIC_API_KEY`
- Deploy: `npm run deploy`

### Future Features
- **Chapter editing/deletion** — Currently chapters can only be added, not edited or removed
- **Book deletion confirmation** — No confirmation dialog yet
- **Cover image re-selection** — Can only set cover at creation time
- **Password reset** — No forgot password flow
- **Rate limiting** — No rate limiting on auth or generation endpoints

## Infrastructure

| Resource | ID | Notes |
|----------|----|-------|
| KV Namespace | `bf1b6840f5764f91b9ea49b2015e97e8` | ARTICLE_CACHE (legacy, still bound but unused) |
| KV Preview | `4009bf44b55e4364a5674856e12fd84f` | For `wrangler dev --remote` |
| D1 Database | `93aeccbf-35ec-4a3b-bc2c-f6fb91bb6a90` | taleium-meta |
| CF Account | `749e8e915104c226e492df9c5bb31444` | Personal account |
| API Model | `claude-haiku-4-5-20251001` | Haiku 4.5 for fast chapter generation |
