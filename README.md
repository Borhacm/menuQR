# Menuly

Menuly is a full-stack multilingual QR menu SaaS for restaurants, inspired by Restsify's product shape but with original brand, content and implementation.

## Tech stack

- Next.js 15 + TypeScript + App Router
- Tailwind CSS 4 + shadcn-style UI components
- Prisma + PostgreSQL
- Auth.js v5 (credentials + Google)
- Stripe subscriptions (checkout, portal, webhook)
- OpenAI or LibreTranslate (menu translation) + OpenAI (image parse endpoint)
- next-intl (EN/ES marketing i18n, menu locales expandable)
- Playwright smoke tests

## Quick start (local)

1. Install dependencies:

```bash
npm install
```

2. Start infrastructure (PostgreSQL + LibreTranslate):

```bash
docker compose up -d
```

3. Configure env:

```bash
cp .env.example .env
```

Translation defaults in `.env.example` are ready for free local translation via LibreTranslate:

```env
TRANSLATE_PROVIDER="auto"
LIBRETRANSLATE_URL="http://127.0.0.1:5001/translate"
LIBRETRANSLATE_PRIMARY_LOCALES="en,es,fr,de,it,pt,ca,ko"
LIBRETRANSLATE_SOURCE_LOCALE="auto"
# Optional fallback endpoint for specific locales (example: nl,ru)
LIBRETRANSLATE_URL_SECONDARY="http://127.0.0.1:5002/translate"
LIBRETRANSLATE_SECONDARY_LOCALES="nl,ru"
```

Docker Compose includes two LibreTranslate services for local development:

- `libretranslate` on `:5001` (general locales)
- `libretranslate_secondary` on `:5002` (focused on `nl,ru`)

4. Push schema + seed:

```bash
npm run db:push
npm run db:seed
```

5. Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000/en`.

## Main routes

- Marketing: `/en`, `/es`, `/en/solutions/*`, `/en/pricing`, `/en/faq`, `/en/blog`
- Auth: `/login`, `/register`, `/verify`
- Admin: `/app/*`
- Public menu (fallback): `/m/[slug]`
- Public menu (subdomain rewrite): `slug.<ROOT_DOMAIN>`

## Useful scripts

```bash
npm run lint
npx tsc --noEmit
npm run test:e2e
```

## Observability (Prometheus + Grafana)

1. Start app (`npm run dev`) on `:3000`.
2. (Optional) set `METRICS_TOKEN` in `.env` if you want to protect metrics endpoints.
3. Start monitoring stack:

```bash
docker compose -f docker-compose.observability.yml up -d
```

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (`admin` / `admin`)
- App metrics (JSON): `/api/internal/metrics`
- App metrics (Prometheus): `/api/internal/metrics/prometheus`
- Grafana dashboard preloaded: **Menuly Overview** (folder `Menuly`)

If you set `METRICS_TOKEN`, update `authorization.credentials` in `monitoring/prometheus.yml` to match.

## Production notes (incremental path)

- Deploy to Vercel
- Use Neon/Supabase Postgres
- Configure wildcard DNS (`*.yourdomain.com`)
- Set Stripe webhook to `/api/stripe/webhook`
- Set `RESEND_API_KEY`, OAuth secrets, and your preferred translation provider env vars
