# COGNITIVE

An IQ-style cognitive assessment and competitive leaderboard platform, built with a
Frutiger-Aero-inspired look: bright skies, glass panels, glossy buttons, soft glow.

> COGNITIVE is an IQ-style cognitive test. Scores are designed for entertainment and
> self-comparison and are **not** equivalent to a standardized clinical or professional
> IQ test.

## Stack

- **Next.js 14** (App Router, TypeScript) — one project for both frontend and backend
  (API routes), so it deploys as a single app.
- **Prisma** ORM, **SQLite** by default (swap to Postgres/MySQL for production with one
  config change — see below).
- **JWT session cookies** (`jose`) + **bcrypt** password hashing (`bcryptjs`). No email,
  no third-party auth provider — just a username and password, as required.
- **Tailwind CSS** for the Frutiger Aero design system (glass panels, glossy buttons,
  gradients — see `src/app/globals.css`).

## Why not plain GitHub Pages

GitHub Pages only serves static files — it can't run the server-side code this app
needs for account creation, password hashing, one-attempt enforcement, secure scoring,
and permanent leaderboards. Those requirements need a real backend, so **the answer key
and the "have they already taken it" check must never live only in the browser.**

This project deploys easily to any Node-friendly host instead:
- **Vercel** (recommended — zero-config Next.js hosting; pair with Vercel Postgres or
  Neon for the database)
- **Railway** or **Render** (Node + persistent Postgres, one click)
- Any VPS that can run `npm run build && npm start`

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
   - `DATABASE_URL` — your Postgres connection string
   - `AUTH_SECRET` — a long random string (never reuse the example value)
4. Run `npx prisma db push` (or `prisma migrate deploy` if you set up migrations)
   against the production database once.
5. Deploy (`vercel deploy`, or connect the repo in Railway/Render's dashboard).

No secret keys are included anywhere in this repo — `.env` is gitignored, and
`.env.example` only contains placeholders.

## Adding the real question bank

This is the **only file you need to touch** to launch: `src/lib/questions.ts`.

Scroll to the clearly marked section:

```
================ QUESTION BANK — ADD QUESTIONS HERE ================
```

Each of the 30 placeholder objects already has the correct `id`, `domain`, and
`difficulty` — don't change those three fields, they define fixed slots in the
assessment. Fill in:

- `prompt` — the question text
- `choices` — an array of answer strings (always multiple choice)
- `correctIndex` — the 0-based index of the right answer in `choices`
- `asset` *(optional)* — an image (`{ type: "image", src, alt }`, dropped in
  `/public/questions/...`) or inline SVG (`{ type: "svg-inline", markup, alt }`)
- `memory` *(required only for MEMORY-domain questions)* — see the field guide comment
  directly above the array, and `MemoryConfig` in `src/lib/types.ts`, for the six
  supported recall types (sequence, positional, item-position association, symbol
  association, multi-attribute, delayed recall with interference).
- `speed` *(optional, SPEED-domain only)* — `{ stimulusDelayMs }` if you want a brief
  "get ready" pause before the stimulus appears.

Once you've filled everything in, run:

```bash
npm run validate-questions
```

This checks for duplicate slots, out-of-range answers, missing Memory config, and any
placeholders you forgot to fill in — before you deploy.

**Nothing else in the app needs to change.** The fixed round order (Easy → Medium →
Hard → Very Hard → Extreme, cycling Logical → Numerical → Pattern → Spatial → Memory →
Speed within each round) is derived automatically from each question's `domain` and
`difficulty` in `getOrderedQuestions()`.

## How the pieces fit together

```
src/
  lib/
    types.ts       — shared types (Domain, Difficulty, Question, MemoryConfig, ...)
    questions.ts    — question bank + ordering logic (edit this to add questions)
    scoring.ts      — the scoring formula, IQ-scale mapping, classification, titles,
                      Type of Smart — all constants are grouped and commented so the
                      formula can be re-tuned without touching anything else
    ranking.ts      — rank/percentile queries against the database
    report.ts       — turns a DB row into the client-safe aggregate report
    auth.ts         — password hashing + JWT session cookie helpers
    db.ts           — Prisma client singleton
  app/
    page.tsx                  — landing page
    register/, login/         — auth pages
    assessment/                — the test-taking flow (stopwatch, memory phases,
                                  anti-cheat, fixed question order)
    results/                   — the logged-in user's own report
    leaderboard/                — all 7 permanent leaderboards
    profile/[username]/         — public profile (aggregate report only — no
                                  individual questions/answers, ever)
    settings/                   — username/password/PFP management
    api/                        — all server-side logic: registration, login,
                                  sanitized question delivery, scored submission
                                  (one-attempt enforced via a DB unique constraint),
                                  leaderboards, public profile data, settings updates
  components/                   — shared UI (glass panels, brain visualization,
                                  memory-challenge renderer, avatar, nav bar)
prisma/schema.prisma             — User + AssessmentResult data model
```

## Security notes (read before launch)

- Correct answers never leave the server. `GET /api/assessment/questions` returns a
  sanitized version of each question (`PublicQuestion`, no `correctIndex`); scoring
  happens entirely in `POST /api/assessment/submit` against the full question bank on
  the server.
- **One attempt per account** is enforced by a real database constraint
  (`AssessmentResult.userId` is `@unique`), not just an application-level check — so
  even a race condition from a duplicated request can't create two results for the
  same user.
- Passwords are hashed with bcrypt (cost factor 12) and never returned by any API
  response.
- Individual question content, the user's answers, and per-question correctness are
  never exposed after submission — not on the results page, not on public profiles —
  only aggregate statistics (per spec).
- **Known, acknowledged limitation:** per-question response time is reported by the
  browser. The server clamps it to a plausible range and caps how much speed can move
  the score (±15% per question, and only for *correct* answers), so it can meaningfully
  reward genuine speed without letting a manipulated timestamp dominate the result —
  but, as with any purely client-timed interaction, a sufficiently determined person
  with browser dev tools could still submit a falsified time. This is a reasonable,
  disclosed limitation rather than a claim of perfect tamper-proofing (per spec §23).
- Anti-cheat (tab-switch detection, disabled context menu/copy) is browser-level and
  discourages casual cheating; it is intentionally not aggressive enough to punish
  normal phone/browser behavior (e.g. a stray notification).

## Scoring, classification & titles

Ranges are implemented exactly as specified in `src/lib/scoring.ts`:

| Score | Classification | Title |
|---|---|---|
| Below 85 | Below Average | The Learner |
| 85–105 | Average | The Thinker |
| 106–114 | Above Average | The Analyst |
| 115–129 | High | The Strategist |
| 130–144 | Very High | The Visionary |
| 145+ | Exceptional / Genius | The Polymath |

"Type of Smart" is derived from the strongest domain(s) and is presented as a fun
interpretation, not a scientific classification, per spec §16.
