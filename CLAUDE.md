# Taleium - Claude Code Instructions

## What Is This

AI-powered educational article platform. Users type a topic, pick a reading level, and get an illustrated magazine-style article with vocabulary, key facts, comprehension quiz, and timeline. Built on Cloudflare Workers + React.

**USP: Education.** This is a learning tool, not a content generator. The reading levels map to UK key stages (KS1, KS2-KS3, GCSE+). The features that differentiate from raw AI (vocabulary callouts, comprehension quizzes, key facts, "Did You Know?" boxes) are the core value proposition. Target users: teachers, students, parents.

## Tech Stack

- **Frontend:** React 18 + React Router + plain CSS (no Tailwind). Vite for build.
- **Backend:** Cloudflare Workers (TypeScript)
- **Storage:** Cloudflare KV (full article cache), Cloudflare D1 (metadata, view counts, browse queries)
- **AI:** Anthropic Claude API (currently Haiku 4.5) for article generation
- **Images:** Wikimedia Commons API for illustrations
- **Dev:** `npm run dev` runs worker (wrangler dev --remote) + Vite concurrently

## Key Architecture Decisions

- **Flat URLs:** `/:slug/:reading-level` (no category prefix). Category is in D1 only, for filtering/browse.
- **Background image resolution:** Article text saves to KV immediately after Claude responds. Images resolve via `ctx.waitUntil()` and update KV when done. Article page auto-refetches after 10s if images are missing.
- **Backwards-compatible educational fields:** `vocabulary`, `didYouKnow`, `keyFacts`, `comprehension` default to empty arrays if missing from cached articles. Old articles still render fine.
- **Read Next:** Only shows existing articles in the same category. No generate buttons (users won't wait).

## Dev Environment Notes

- Must use `wrangler dev --remote` because Crostini DNS doesn't resolve from local workerd.
- Needs a preview KV namespace (preview_id in wrangler.toml) for remote dev.
- Secrets go in `.dev.vars` (not `wrangler secret`) for local/remote dev.
- Production secrets need `wrangler secret put ANTHROPIC_API_KEY`.

## File Structure

```
src/
  client/           # React SPA
    pages/          # Home, Article, Browse, NotFound
    components/     # ArticleRenderer, ComprehensionQuiz, ReadAloudControls, etc.
    styles/         # variables.css, global.css, article.css
  worker/           # Cloudflare Worker
    index.ts        # Route dispatcher
    types.ts        # All shared TypeScript interfaces
    routes/         # generate.ts, article.ts, sitemap.ts
    services/       # claude.ts, cache.ts, wikimedia.ts
    utils/          # slug.ts, validate.ts
```

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/generate | Generate article, return slug |
| GET | /api/article/:slug/:level | Fetch full cached article |
| GET | /api/suggestions/:slug/:level | Related articles for Read Next |
| GET | /api/browse | Recent 50 articles |
| GET | /api/browse/:category | Filter by category |
| GET | /sitemap.xml | SEO sitemap |

## Known Issues / Current State

See `docs/current-state.md` for detailed status including open issues.
