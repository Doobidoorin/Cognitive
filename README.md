# COGNITIVE

An IQ-style cognitive assessment 
> COGNITIVE is an IQ-style cognitive test. Scores are designed for entertainment and
- **Next.js 14** (App Router, TypeScript) one project for both frontend and backend
  (API routes), so it deploys as a single app.
- **Prisma** ORM, **SQLite** by default (swap to Postgres/MySQL for production with one
  config change see below).
- **JWT session cookies** (`jose`) + **bcrypt** password hashing (`bcryptjs`). No email,
  no third-party auth provider just a username and password as required.
- **Tailwind CSS** for design system (glass panels, glossy buttons,
  gradients — see `src/app/globals.css`).


This project deploys easily to any Node friendly host instead:
- **Vercel**
- **Railway** or **Render** `npm run build && npm start`

## Getting started locally

```bash
npm install
cp .env.example .env
# edit .env: set AUTH_SECRET to a long random string, e.g.
#   openssl rand -base64 48
npx prisma db push     # creates the local SQLite database from prisma/schema.prisma
npm run dev
```

Visit `http://localhost:3000`.

## Deploying to production

1. Provision a Postgres database (Vercel Postgres, Neon, Railway, Supabase, etc).
2. In `prisma/schema.prisma`, change:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
3. Set environment variables on your host:
   - `DATABASE_URL` your Postgres connection string
   - `AUTH_SECRET` a long random string (never reuse the example value)
4. Run `npx prisma db push` (or `prisma migrate deploy` if you set up migrations)
   against the production database once.
5. Deploy (`vercel deploy`, or connect the repo in Railway/Render's dashboard).

No secret keys are included anywhere in this repo `.env` is gitignored and
`.env.example` only contains placeholders

This is the only file you need to touch to launch: `src/lib/questions.ts`.

