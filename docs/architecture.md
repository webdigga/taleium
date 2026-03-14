# Architecture

## Overview

Taleium is a full-stack Cloudflare application: a React SPA served from Workers Sites, with a Cloudflare Worker API backend that calls Claude for article generation and Wikimedia Commons for images.

## Request Flow: Article Generation

```
User types topic → POST /api/generate
  → Validate input, generate slug
  → Check KV cache (hit? return immediately)
  → Call Claude API (Haiku 4.5, max 5000 tokens)
  → Parse & validate JSON response
  → Save article to KV with null images
  → Save metadata to D1
  → Return { slug, readingLevel } to client
  → Background (ctx.waitUntil):
      → Resolve all images from Wikimedia Commons in parallel
      → Update KV with resolved images
      → Update D1 metadata with hero_image_url

Client navigates to /:slug/:level
  → GET /api/article/:slug/:level
  → Return article from KV (may have null images initially)
  → If images missing, client auto-refetches after 10 seconds
```

## Data Model

### KV Cache (ARTICLE_CACHE)
- Key: `article:{slug}:{level}`
- Value: Full `CachedArticle` JSON (article content + resolved images)
- Purpose: Fast retrieval, full article data

### D1 Database (taleium-meta)
- Table: `articles`
- Purpose: Metadata for browse/search, view counts, category filtering, sitemap
- Indexed on: slug, category, generated_at

### CachedArticle Structure
```
CachedArticle
  ├── slug, readingLevel, topic, generatedAt
  ├── article (GeneratedArticle)
  │   ├── title, subtitle, summary, category, era
  │   ├── introduction, conclusion, pullQuote
  │   ├── sections[] (heading, content, imageQuery, imageCaption)
  │   ├── timeline[] (date, event)
  │   ├── furtherReading[]
  │   ├── vocabulary[] (term, definition)
  │   ├── didYouKnow[]
  │   ├── keyFacts[]
  │   └── comprehension[] (question, options[], correctIndex, explanation)
  └── images
      ├── hero (ResolvedImage | null)
      └── sections[] (ResolvedImage | null)
```

## Reading Levels

| Level | Ages | UK Key Stage | Word Target | Sections |
|-------|------|-------------|-------------|----------|
| young-explorer | 6-9 | KS1 | ~600 | 3-4 |
| curious-mind | 10-13 | KS2-KS3 | ~900 | 4-5 |
| deep-dive | Adult | GCSE+ | ~1500 | 4-6 |

## Article Page Features

1. **Reading progress bar** - gradient bar (coral→gold) fixed below header, fills on scroll
2. **Read time badge** - estimated minutes based on word count / 200 wpm
3. **Key Facts box** - gold-bordered card before the introduction
4. **Did You Know boxes** - warm yellow callouts spaced between sections
5. **Pull Quote** - highlighted quote/fact at article midpoint
6. **Timeline** - chronological key dates with vertical line
7. **Vocabulary section** - grid of term/definition cards after conclusion
8. **Comprehension Quiz** - interactive multiple choice with instant feedback + score
9. **Read Aloud** - Web Speech API with play/pause/stop, speed control, section tracking
10. **Read Next** - related articles from same category (existing only)
11. **Image Credits** - attribution list at bottom

## Image Resolution (Wikimedia)

- Queries Wikimedia Commons API with `User-Agent` header (required, blocks 403s from CF edge)
- Filters: JPG/PNG only, min 400px wide
- Fallback: simplifies query to first 3 words if no results
- All section images + hero resolved in parallel via `Promise.all`
- Runs in background after article text is saved

## Design System

- **Palette:** Warm cream (#F7F3ED) content, dark navy (#1B2A4A) hero/header, coral (#E2725B) accent, gold (#D4A03C) secondary
- **Fonts:** Vollkorn (heading), DM Sans (body), Sora (display) — loaded from Google Fonts
- **Reading level colours:** Gold (young-explorer), Blue (curious-mind), Purple (deep-dive)
- **Layout:** Content max 720px, page max 1200px, mobile-first responsive

## Categories

`history | science | nature | geography | technology | food | health | arts | sport | space | maths | language`

Claude picks the best fit. Category is stored in D1 for filtering/browse, not in URLs.
