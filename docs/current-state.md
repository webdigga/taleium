# Current State (2026-03-14)

## What's Working

- Full article generation pipeline (Claude → KV/D1 → React rendering)
- Three reading levels with UK key stage labels
- Wikimedia Commons images with attribution (background resolution)
- Browse page with category filtering
- Read Aloud (Web Speech API) with section tracking
- Read Next suggestions (existing articles in same category)
- SEO: sitemap.xml, robots.txt, meta descriptions
- Mobile-responsive design

## Recently Added (This Session)

### Educational Features
All newly added to the Claude prompt and article renderer:
- **Key Facts box** — 3-5 essential takeaways, shown before the introduction
- **Vocabulary callouts** — 4-6 key terms with definitions, grid layout after conclusion
- **"Did You Know?" boxes** — 2-3 surprising facts, spaced between article sections
- **Comprehension Quiz** — 3-4 multiple-choice questions with instant right/wrong feedback, explanations, and a final score

### Article Page Enhancements
- **Reading progress bar** — gradient bar fixed below the sticky header, animates as user scrolls
- **Read time estimate** — "X min read" badge in article meta (word count / 200 wpm)

### Messaging Pivot to Education
Updated all copy to reflect the education USP:
- Hero: "Any topic. Any reading level. Instantly."
- Subtitle: "...get a lesson ready to read, share, or print"
- Reading levels now show key stages: "KS1 · Ages 6-9", "KS2-KS3 · Ages 10-13", "GCSE+ · Adult"
- Topic suggestions switched to curriculum-aligned: Water Cycle, Photosynthesis, Roman Empire, etc.
- Search placeholder: "What do you want to learn about?"
- Footer: "Illustrated learning at every reading level."

### Bug Fixes
- Read Next cards now have `.read-next-body` wrapper for proper padding
- Read Next grid goes to horizontal single-column on mobile
- Featured section cards have horizontal padding on mobile

## Open Issue: Generation Timeout

### The Problem
`POST /api/generate` returns **504 Gateway Time-out** after ~60 seconds. The expanded Claude prompt (article + vocabulary + quiz + key facts + did-you-know) generates more output, pushing the total API call time past the worker/dev-proxy limit.

### What Was Done
1. **Background image resolution** — Article text saves to KV immediately after Claude responds, images resolve in `ctx.waitUntil()`. This removed ~15-20s of Wikimedia calls from the critical path.
2. **Switched from Sonnet to Haiku 4.5** (`claude-haiku-4-5-20251001`) — significantly faster generation.
3. **Trimmed the prompt** — reduced word count targets (600/900/1500 down from 800/1200/2000), compressed the JSON schema example, reduced section counts.
4. **Reduced max_tokens** from 8000 to 5000.

### Current Status
The model was just switched to Haiku and the prompt trimmed. **This has not been tested yet.** The user reported one more 504 after the background image change but before the Haiku switch.

### If It Still Times Out
Options to try next:
1. **Verify it's the Claude API call** — add `console.log` timestamps before/after the `fetch` to confirm where the 60s is spent
2. **Check if it's a dev-proxy issue only** — the `wrangler dev --remote` proxy may have its own timeout that's stricter than production. Try deploying and testing in production.
3. **Streaming** — use Claude's streaming API (`stream: true`) to keep the connection alive. Collect chunks, parse full JSON at the end. This may bypass subrequest timeouts since time-to-first-byte is fast.
4. **Two-phase generation** — generate the article content first (fast), then generate educational features (vocabulary, quiz) in a second, smaller API call that runs in `waitUntil()`. The article renders immediately; educational features appear on refresh.
5. **Further reduce output** — drop comprehension questions to 2, vocabulary to 3 terms, etc.

### The User's Observation
The user noted "articles are getting created" even with the 504 — meaning the worker likely completes the Claude call and saves to KV, but the dev proxy kills the HTTP response before it returns. The article exists in cache; the client just gets a 504 instead of a redirect. This suggests it may work fine in production.

## Not Yet Done

### Production Deployment
- Need to `wrangler secret put ANTHROPIC_API_KEY` for production
- First production deploy: `npm run deploy`
- D1 migration needs to be run on production: `npm run db:migrate`

### Future Features Discussed
- **Print/PDF export** — formatted handout for classrooms
- **Collections/Bookshelf** — curated sets of articles (teacher reading lists, student libraries)
- **Progressive reading** — "Ready for the next level?" linking same topic at higher level (decided to skip for now)

## Infrastructure

| Resource | ID | Notes |
|----------|----|-------|
| KV Namespace | `bf1b6840f5764f91b9ea49b2015e97e8` | ARTICLE_CACHE |
| KV Preview | `4009bf44b55e4364a5674856e12fd84f` | For `wrangler dev --remote` |
| D1 Database | `93aeccbf-35ec-4a3b-bc2c-f6fb91bb6a90` | taleium-meta |
| CF Account | `749e8e915104c226e492df9c5bb31444` | Personal account |
| API Model | `claude-haiku-4-5-20251001` | Was Sonnet, switched for speed |
