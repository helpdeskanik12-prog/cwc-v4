# CineWorld Clips v4 — Cloudflare Native

VOD streaming platform built entirely on Cloudflare: Pages + Workers + D1.

## Architecture

```
_worker.js          → All /api/* routes (auth, movies, admin, stripe, categories)
public/index.html   → Single-page app (SPA) — no build step, no npm needed
schema.sql          → D1 database schema
wrangler.jsonc      → Cloudflare Pages + D1 config
```

**Zero dependencies at runtime** — everything runs in the browser (fetch API) and Cloudflare Worker (Web Crypto, fetch to Stripe REST API).

## Quick Deploy

```bash
# 1. Create D1 database
wrangler d1 create cwc-db

# 2. Apply schema
wrangler d1 execute cwc-db --file=./schema.sql

# 3. Set secrets (replace with real values)
wrangler secret put JWT_ACCESS_SECRET
wrangler secret put JWT_REFRESH_SECRET
wrangler secret put STRIPE_SECRET_KEY

# 4. Deploy
wrangler pages deploy out --project-name=cineworldclips
```

## Local Dev

```bash
# Serve SPA locally (no build needed)
cd out && python3 -m http.server 8080
# Then open http://localhost:8080
# API calls will 404 locally — use wrangler pages dev for full stack
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `JWT_ACCESS_SECRET` | HMAC-SHA256 secret for 15-min access tokens |
| `JWT_REFRESH_SECRET` | HMAC-SHA256 secret for 7-day refresh tokens |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PREMIUM_MONTHLY` | Stripe Price ID for monthly plan |
| `STRIPE_PREMIUM_YEARLY` | Stripe Price ID for yearly plan |

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/movies?page=&limit=&region=&search=
GET    /api/movies/:id
POST   /api/movies              [superadmin]
PATCH  /api/movies/:id          [superadmin]
DELETE /api/movies/:id          [superadmin]

GET    /api/categories

GET    /api/admin/dashboard     [superadmin]
GET    /api/admin/users         [superadmin]

POST   /api/stripe/create-checkout  [auth]
POST   /api/stripe/webhook

GET    /api/health
```

## Superadmin

Users registered with `siyam01751@gmail.com` or `admin@cineworld.com` get superadmin role automatically.


## vs v3 (cineworldclips.onrender.com)

| | v3 | v4 |
|---|---|---|
| Backend | Fastify 5 + MongoDB Atlas | Cloudflare Worker + D1 |
| Frontend | Next.js 14 (npm build) | Single file SPA (no build) |
| Auth | JWT + Refresh rotation | Web Crypto JWT + PBKDF2 |
| Media | Cloudflare R2 | YouTube embeds |
| Payments | Stripe SDK | Stripe REST API (fetch) |
| Hosting | Render ($) | Cloudflare Pages (free) |
