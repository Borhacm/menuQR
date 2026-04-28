# Menuly

Menuly is a full-stack multilingual QR menu SaaS for restaurants, inspired by Restsify's product shape but with original brand, content and implementation.

## Tech stack

- Next.js 15 + TypeScript + App Router
- Tailwind CSS 4 + shadcn-style UI components
- Prisma + PostgreSQL
- Auth.js v5 (credentials + Google)
- Stripe subscriptions (checkout, portal, webhook)
- OpenAI (menu translation + image parse endpoint)
- next-intl (EN/ES marketing i18n, menu locales expandable)
- Playwright smoke tests

## Quick start (local)

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Configure env:

```bash
cp .env.example .env
```

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

## Production notes (incremental path)

- Deploy to Vercel
- Use Neon/Supabase Postgres
- Configure wildcard DNS (`*.yourdomain.com`)
- Set Stripe webhook to `/api/stripe/webhook`
- Set `OPENAI_API_KEY`, `RESEND_API_KEY`, OAuth secrets
