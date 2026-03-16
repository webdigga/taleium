# Architecture

## Overview

Taleium is a full-stack Cloudflare application: a React SPA served from Workers Sites, with a Cloudflare Worker API backend. Users create stories chapter by chapter with AI assistance. Auth is email + password with PBKDF2 hashing and HttpOnly session cookies.

## Request Flow: Chapter Generation

```
User writes a prompt → POST /api/books/:id/chapters
  → Validate session (HttpOnly cookie → D1 sessions/users join)
  → Fetch book + existing chapters from D1
  → Verify ownership
  → Build story context (full ch1 + excerpts of middle + full last chapter)
  → Call Claude API (Haiku 4.5, max 2000 tokens)
  → Parse JSON response { title, content }
  → Insert chapter into D1, update book chapter_count
  → Return { chapter } to client
```

### Alternative: Direction-Based Creation

```
User requests directions → POST /api/books/:id/directions
  → Same auth + book fetch
  → Call Claude API with story context
  → Return { directions: [{ id, summary, preview }] }

User picks a direction → POST /api/books/:id/chapters/from-direction
  → Combines summary + preview into a prompt
  → Same flow as chapter generation above
```

## Data Model

### D1 Database (taleium-meta)

**users** — id (UUID), email (unique), password_hash, salt, display_name, timestamps
**sessions** — id (UUID, sent as cookie), user_id, created_at, expires_at (30 days)
**books** — id (UUID), user_id, title, description, age_range, visibility, share_token, cover_image, chapter_count, timestamps
**chapters** — id (UUID), book_id, chapter_number, title, content, user_prompt, created_at

### Auth Flow

```
Signup/Login → PBKDF2 hash (100k iterations, SHA-256, random 16-byte salt)
            → Create session row in D1
            → Set HttpOnly cookie: session=<uuid>
            → 30-day expiry

Each API request → Read cookie → JOIN sessions+users → verify expires_at > now
```

## Age Ranges

| Range | Ages | Word Target | AI Style |
|-------|------|-------------|----------|
| 3-5 | 3-5 | 150-250 | Simple vocabulary, short sentences, playful |
| 6-8 | 6-8 | 250-400 | Clear vocab, adventure tone, dialogue |
| 9-12 | 9-12 | 400-600 | Rich vocabulary, complex sentences, plot twists |

## Story Context Compression

To keep Claude prompts manageable for long stories:
- **Full first chapter** — establishes setting, characters, tone
- **Title + first 100 chars of middle chapters** — maintains continuity
- **Full last chapter** — provides immediate context for continuation

## Visibility Model

Per-book setting:
- **private** (default) — only the owner can see
- **public** — listed on `/browse`, accessible to anyone
- **link** — accessible via `/shared/:token`, not listed

Share tokens are auto-generated when visibility is set to `link` or `public`.

## Cover Images (Wikimedia)

- Queries Wikimedia Commons API with `User-Agent` header
- Filters: JPG/PNG only, min 400px wide
- Fallback: simplifies query to first 3 words if no results
- Runs in background (`ctx.waitUntil`) after book creation

## Design System

- **Palette:** Warm cream (#F7F3ED) content, dark navy (#1B2A4A) hero/header, coral (#E2725B) accent, gold (#D4A03C) secondary
- **Fonts:** Vollkorn (heading), DM Sans (body), Sora (display) — loaded from Google Fonts
- **Age range colours:** Gold (3-5), Blue (6-8), Purple (9-12)
- **Layout:** Content max 720px, page max 1200px, mobile-first responsive

## Frontend Routes

| Route | Page | Auth? |
|-------|------|-------|
| `/` | Landing (hero + public books) or redirect to Dashboard | No |
| `/signup` | Sign up form | No |
| `/login` | Login form | No |
| `/dashboard` | "My Books" shelf | Yes |
| `/create` | Create new book | Yes |
| `/books/:id` | Book workshop (chapters, settings) | Yes (owner) |
| `/books/:id/new-chapter` | Write prompt or pick direction | Yes (owner) |
| `/books/:id/read` | Read full story | Yes (owner) |
| `/shared/:token` | Read shared book | No |
| `/browse` | Public books grid | No |
