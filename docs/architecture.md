# Architecture

## Overview

Taleium is a full-stack Cloudflare application: a React SPA served from Workers Sites, with a Cloudflare Worker API backend. Users create stories chapter by chapter with AI assistance. Auth is email + password with PBKDF2 hashing and HttpOnly session cookies. Monetisation is freemium via Stripe subscriptions.

## Request Flow: Chapter Generation

```
User writes a prompt -> POST /api/books/:id/chapters
  -> Validate session (HttpOnly cookie -> D1 sessions/users join)
  -> Fetch book + existing chapters from D1
  -> Verify ownership
  -> Check free tier limit (subscription_status + chapter count)
  -> Build story context (full ch1 + excerpts of middle + full last chapter)
  -> Call Claude API (Haiku 4.5, max 2000 tokens)
  -> Parse JSON response { title, content }
  -> Insert chapter into D1, update book chapter_count
  -> Return { chapter } to client
```

### Alternative: Direction-Based Creation

```
User requests directions -> POST /api/books/:id/directions
  -> Same auth + book fetch + limit check
  -> Call Claude API with story context
  -> Return { directions: [{ id, summary, preview }] }

User picks a direction -> POST /api/books/:id/chapters/from-direction
  -> Combines summary + preview into a prompt
  -> Same flow as chapter generation above
```

## Data Model

### D1 Database (taleium-meta)

**users** - id (UUID), email (unique), password_hash, salt, display_name, subscription_status, stripe_customer_id, timestamps
**sessions** - id (UUID, sent as cookie), user_id, created_at, expires_at (30 days)
**books** - id (UUID), user_id, title, description, age_range, visibility, share_token, cover_image, chapter_count, timestamps
**chapters** - id (UUID), book_id, chapter_number, title, content, user_prompt, created_at
**subscriptions** - id (UUID), user_id, stripe_subscription_id, stripe_customer_id, status, current_period_end, cancel_at_period_end, timestamps

### Auth Flow

```
Signup/Login -> PBKDF2 hash (100k iterations, SHA-256, random 16-byte salt)
            -> Create session row in D1
            -> Set HttpOnly cookie: session=<uuid>
            -> 30-day expiry
            -> Signup sends notification email via ctx.waitUntil

Each API request -> Read cookie -> JOIN sessions+users -> verify expires_at > now
                 -> User object includes subscription_status for limit checks
```

## Freemium Model

### Limits

| Plan | Books | Chapters per book | Price |
|------|-------|-------------------|-------|
| Free | 1 | 3 | £0 |
| Premium | Unlimited | Unlimited | £4.99/month |

### Subscription States

| Status | Access | Meaning |
|--------|--------|---------|
| `free` | Limited | Default for new users |
| `active` | Full | Paying subscriber |
| `past_due` | Full | Payment failed, Stripe retrying (grace period) |
| `cancelled` | Limited | Subscription ended |

`past_due` is treated the same as `active` for access - this gives a grace period while Stripe retries the payment. Only `free` and `cancelled` enforce limits.

### Limit Enforcement

Checked server-side in `routes/books.ts`:
- `handleCreateBook` - checks book count against FREE_BOOK_LIMIT (1)
- `handleCreateChapter` - checks chapter count against FREE_CHAPTER_LIMIT (3)
- `handleGetDirections` - same chapter limit check (no point suggesting directions they can't use)
- `handleCreateChapterFromDirection` - same chapter limit check

Error responses include a `code` field (`BOOK_LIMIT_REACHED` or `CHAPTER_LIMIT_REACHED`) so the frontend can show upgrade prompts rather than generic errors.

## Stripe Integration

### Payment Flow

```
User clicks "Upgrade to Premium"
  -> Frontend POST /api/billing/checkout
  -> Backend creates Stripe Customer (if first time)
  -> Backend creates Stripe Checkout Session
  -> Returns { url } -> frontend redirects to Stripe-hosted checkout
  -> User pays on Stripe
  -> Stripe redirects to /dashboard?upgraded=1
  -> Stripe sends checkout.session.completed webhook
  -> Backend sets users.subscription_status = 'active'
  -> Backend creates subscriptions row
```

### Webhook Handling

Endpoint: `POST /api/billing/webhook`
Signature verified with HMAC-SHA256 (Web Crypto API) before processing.

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set user active, create subscription record |
| `customer.subscription.updated` | Update status (active/past_due/cancelled) |
| `customer.subscription.deleted` | Set user cancelled |
| `invoice.payment_failed` | Set user past_due |

### Billing Portal

Paid users can manage their subscription (cancel, update payment method) via Stripe's hosted Billing Portal. Accessed from the Account page via `POST /api/billing/portal`.

### Architecture Notes

- No Stripe SDK - Workers-compatible raw fetch to api.stripe.com with form-encoded bodies
- Stripe Customer created lazily on first checkout (not at signup)
- `users.subscription_status` is the fast-path for limit checks (no extra query)
- `subscriptions` table is the audit trail with full Stripe metadata
- Webhook uses `getUserByStripeCustomerId` to find the user from Stripe events

## Age Ranges

| Range | Ages | Word Target | AI Style |
|-------|------|-------------|----------|
| 3-5 | 3-5 | 150-250 | Simple vocabulary, short sentences, playful |
| 6-8 | 6-8 | 250-400 | Clear vocab, adventure tone, dialogue |
| 9-12 | 9-12 | 400-600 | Rich vocabulary, complex sentences, plot twists |

## Story Context Compression

To keep Claude prompts manageable for long stories:
- **Full first chapter** - establishes setting, characters, tone
- **Title + first 100 chars of middle chapters** - maintains continuity
- **Full last chapter** - provides immediate context for continuation

## Visibility Model

Per-book setting:
- **private** (default) - only the owner can see
- **public** - listed on `/browse`, accessible to anyone
- **link** - accessible via `/shared/:token`, not listed

Share tokens are auto-generated when visibility is set to `link` or `public`.

## Cover Images (Wikimedia)

- Queries Wikimedia Commons API with `User-Agent` header
- Filters: JPG/PNG only, min 400px wide
- Fallback: simplifies query to first 3 words if no results
- Runs in background (`ctx.waitUntil`) after book creation

## Design System

- **Palette:** Warm cream (#F7F3ED) content, dark navy (#1B2A4A) hero/header, coral (#E2725B) accent, gold (#D4A03C) secondary
- **Fonts:** Vollkorn (heading), DM Sans (body), Sora (display) - loaded from Google Fonts
- **Age range colours:** Gold (3-5), Blue (6-8), Purple (9-12)
- **Layout:** Content max 720px, page max 1200px, mobile-first responsive

## Frontend Routes

| Route | Page | Auth? |
|-------|------|-------|
| `/` | Landing (hero + how it works + features + pricing + public books) or redirect to Dashboard | No |
| `/signup` | Sign up form | No |
| `/login` | Login form | No |
| `/dashboard` | "My Books" shelf + upgrade prompt at limit | Yes |
| `/create` | Create new book (or upgrade prompt at limit) | Yes |
| `/books/:id` | Book workshop (chapters, settings, upgrade prompt at chapter limit) | Yes (owner) |
| `/books/:id/new-chapter` | Write prompt or pick direction (or upgrade prompt at limit) | Yes (owner) |
| `/books/:id/read` | Read full story | Yes (owner) |
| `/account` | Profile, plan, billing management | Yes |
| `/shared/:token` | Read shared book | No |
| `/browse` | Public books grid | No |

## Email Notifications

- **Provider:** Resend via mail.kabooly.com
- **Signup notification:** Sent to NOTIFY_EMAIL (owner) on every new user registration, via ctx.waitUntil (non-blocking)
