# Taleium - Claude Code Instructions

## What Is This

Collaborative family story creation tool. Parents and children sit together, create stories chapter by chapter, and build their own books. AI helps by writing prose from prompts or suggesting story directions. Built on Cloudflare Workers + React.

**USP: Family collaboration.** This is a tool for parents and children to create stories together. The AI assists - it doesn't replace the creative process. Users write a prompt OR pick from AI-suggested directions. Age ranges (3-5, 6-8, 9-12) adjust AI language complexity.

**Business model:** Freemium. Free tier = 1 book, 3 chapters. Premium = unlimited, £4.99/month via Stripe.

## Tech Stack

- **Frontend:** React 18 + React Router + plain CSS (no Tailwind). Vite for build.
- **Backend:** Cloudflare Workers (TypeScript)
- **Storage:** Cloudflare D1 (users, sessions, books, chapters, subscriptions). KV namespace still bound but unused.
- **AI:** Anthropic Claude API (Haiku 4.5) for chapter generation and direction suggestions
- **Images:** Wikimedia Commons API for book covers
- **Auth:** Email + password, PBKDF2 hashing (100k iterations), HttpOnly session cookies (30 days)
- **Payments:** Stripe (raw fetch, no SDK). Checkout Sessions for payment, Billing Portal for management, webhooks for lifecycle.
- **Email:** Resend (via mail.kabooly.com) for signup notifications
- **Dev:** `npm run dev` runs worker (wrangler dev --remote) + Vite concurrently

## Key Architecture Decisions

- **Same device, single account:** Parent + child use the same session. No child accounts.
- **Per-book age range:** 3-5 (150-250 words/chapter), 6-8 (250-400), 9-12 (400-600).
- **Story context compression:** Full first chapter + titles/excerpts of middle chapters + full last chapter sent to Claude.
- **Per-book visibility:** Private (default), public (listed in Browse), or shareable link.
- **Background cover images:** Book cover resolves via `ctx.waitUntil()` after creation.
- **Freemium limits enforced server-side:** Book/chapter limits checked in routes/books.ts before creation. Returns error codes `BOOK_LIMIT_REACHED` / `CHAPTER_LIMIT_REACHED`.
- **Stripe integration via raw fetch:** No Stripe SDK (not compatible with Workers). All calls use form-encoded POST to api.stripe.com. Webhook signature verified with HMAC-SHA256 via Web Crypto API.
- **Subscription status on users table:** `users.subscription_status` for fast limit checks. Separate `subscriptions` table for full Stripe lifecycle audit trail.

## Dev Environment Notes

- Must use `wrangler dev --remote` because Crostini DNS doesn't resolve from local workerd.
- Needs a preview KV namespace (preview_id in wrangler.toml) for remote dev.
- Secrets go in `.dev.vars` (not `wrangler secret`) for local/remote dev.
- `.dev.vars` contains: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`
- Production secrets set via `wrangler secret put` for each of the above.
- Non-secret config in `wrangler.toml` vars: `STRIPE_PRICE_ID`, `NOTIFY_EMAIL`

## File Structure

```
src/
  client/           # React SPA
    context/        # AuthContext (includes subscriptionStatus)
    pages/          # Home, SignUp, Login, Dashboard, CreateBook, BookView, AddChapter, ReadStory, SharedBook, Browse, Account, NotFound
    components/     # AuthForm, AuthGuard, AgeRangePicker, BookCard, ChapterCard, DirectionCard, ChapterReader, VisibilityPicker, PromptInput, LoadingChapter, ImageWithAttribution, ReadAloudControls, UpgradePrompt, Header, Footer
    styles/         # variables.css, global.css, book.css
  worker/           # Cloudflare Worker
    index.ts        # Route dispatcher
    types.ts        # All shared TypeScript interfaces + free tier constants
    routes/         # auth.ts, books.ts, billing.ts, public.ts, sitemap.ts
    services/       # auth.ts, db.ts, claude.ts, wikimedia.ts, stripe.ts, email.ts
    utils/          # validate.ts
migrations/         # 001_init.sql, 002_pivot.sql, 003_subscriptions.sql
```

## API Routes

### Auth
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/auth/signup | Create account + set session cookie + notify owner |
| POST | /api/auth/login | Verify password + set session cookie |
| POST | /api/auth/logout | Clear session |
| GET | /api/auth/me | Current user (inc. subscriptionStatus) or 401 |

### Books (auth required)
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/books | User's books |
| POST | /api/books | Create book (free tier: max 1) |
| GET | /api/books/:id | Book + chapters |
| PATCH | /api/books/:id | Update title/description/visibility |
| DELETE | /api/books/:id | Delete book |
| POST | /api/books/:id/chapters | Generate chapter from prompt (free tier: max 3) |
| POST | /api/books/:id/directions | Get AI-suggested directions (blocked at chapter limit) |
| POST | /api/books/:id/chapters/from-direction | Generate chapter from picked direction (free tier: max 3) |

### Billing
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/billing/checkout | Yes | Create Stripe Checkout Session, return URL |
| POST | /api/billing/portal | Yes | Create Stripe Billing Portal session, return URL |
| GET | /api/billing/status | Yes | Current subscription details |
| POST | /api/billing/webhook | No (Stripe signature) | Handle Stripe lifecycle events |

### Public (no auth)
| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/public | Browse public books |
| GET | /api/public/:bookId | Read public book |
| GET | /api/shared/:token | Read shared book |

## D1 Schema

Five tables: `users`, `sessions`, `books`, `chapters`, `subscriptions`. See `migrations/003_subscriptions.sql` for the subscription additions.

- `users.subscription_status` - free | active | past_due | cancelled
- `users.stripe_customer_id` - set on first checkout
- `subscriptions` table tracks full Stripe lifecycle (subscription ID, period end, cancel_at_period_end)

## Stripe Integration

- **Product:** Taleium Premium (prod_UAzUkpBPsYkBan)
- **Price:** £4.99/month (price_1TCdVKGVztTSUfuwPCIzEH27)
- **Webhook events:** checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed
- **Webhook endpoint:** https://taleium.com/api/billing/webhook
- **Billing Portal:** Enabled for cancel + payment method update
- **Business entity:** Kabooly Ltd (statement descriptor: KABOOLY / TALEIUM)
