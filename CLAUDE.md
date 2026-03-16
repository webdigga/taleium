# Taleium - Claude Code Instructions

## What Is This

Collaborative family story creation tool. Parents and children sit together, create stories chapter by chapter, and build their own books. AI helps by writing prose from prompts or suggesting story directions. Built on Cloudflare Workers + React.

**USP: Family collaboration.** This is a tool for parents and children to create stories together. The AI assists — it doesn't replace the creative process. Users write a prompt OR pick from AI-suggested directions. Age ranges (3-5, 6-8, 9-12) adjust AI language complexity.

## Tech Stack

- **Frontend:** React 18 + React Router + plain CSS (no Tailwind). Vite for build.
- **Backend:** Cloudflare Workers (TypeScript)
- **Storage:** Cloudflare D1 (users, sessions, books, chapters). KV namespace still bound but unused.
- **AI:** Anthropic Claude API (Haiku 4.5) for chapter generation and direction suggestions
- **Images:** Wikimedia Commons API for book covers
- **Auth:** Email + password, PBKDF2 hashing (100k iterations), HttpOnly session cookies (30 days)
- **Dev:** `npm run dev` runs worker (wrangler dev --remote) + Vite concurrently

## Key Architecture Decisions

- **Same device, single account:** Parent + child use the same session. No child accounts.
- **Per-book age range:** 3-5 (150-250 words/chapter), 6-8 (250-400), 9-12 (400-600).
- **Story context compression:** Full first chapter + titles/excerpts of middle chapters + full last chapter sent to Claude.
- **Per-book visibility:** Private (default), public (listed in Browse), or shareable link.
- **Background cover images:** Book cover resolves via `ctx.waitUntil()` after creation.

## Dev Environment Notes

- Must use `wrangler dev --remote` because Crostini DNS doesn't resolve from local workerd.
- Needs a preview KV namespace (preview_id in wrangler.toml) for remote dev.
- Secrets go in `.dev.vars` (not `wrangler secret`) for local/remote dev.
- Production secrets need `wrangler secret put ANTHROPIC_API_KEY`.
- Run migration: `wrangler d1 execute taleium-meta --file=./migrations/002_pivot.sql`

## File Structure

```
src/
  client/           # React SPA
    context/        # AuthContext
    pages/          # Home, SignUp, Login, Dashboard, CreateBook, BookView, AddChapter, ReadStory, SharedBook, Browse, NotFound
    components/     # AuthForm, AuthGuard, AgeRangePicker, BookCard, ChapterCard, DirectionCard, ChapterReader, VisibilityPicker, PromptInput, LoadingChapter, ImageWithAttribution, Header, Footer
    styles/         # variables.css, global.css, book.css
  worker/           # Cloudflare Worker
    index.ts        # Route dispatcher
    types.ts        # All shared TypeScript interfaces
    routes/         # auth.ts, books.ts, public.ts, sitemap.ts
    services/       # auth.ts, db.ts, claude.ts, wikimedia.ts
    utils/          # validate.ts
```

## API Routes

### Auth
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/auth/signup | Create account + set session cookie |
| POST | /api/auth/login | Verify password + set session cookie |
| POST | /api/auth/logout | Clear session |
| GET | /api/auth/me | Current user or 401 |

### Books (auth required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/books | User's books |
| POST | /api/books | Create book |
| GET | /api/books/:id | Book + chapters |
| PATCH | /api/books/:id | Update title/description/visibility |
| DELETE | /api/books/:id | Delete book |
| POST | /api/books/:id/chapters | Generate chapter from prompt |
| POST | /api/books/:id/directions | Get AI-suggested directions |
| POST | /api/books/:id/chapters/from-direction | Generate chapter from picked direction |

### Public (no auth)
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/public | Browse public books |
| GET | /api/public/:bookId | Read public book |
| GET | /api/shared/:token | Read shared book |

## D1 Schema

Four tables: `users`, `sessions`, `books`, `chapters`. See `migrations/002_pivot.sql`.
