# Holdback HQ: handoff

Paste this file into a new chat to pick up where the last one ended (October 24, 2026; updated after the design follow-ups).

## What it is

An internal ops app for an AI agency that manages Ontario trade subcontractors (electrical, mechanical, drywall). It tracks prompt-payment deadlines, holdback releases and WSIB clearances under the Construction Act (2026 rules), drafts reminder emails that are only sent after a person approves them, and produces a "Cash Leak Scan" PDF for prospects.

## Where everything lives

| Thing | Location |
|---|---|
| App code | https://github.com/nicanoruhart2030-cyber/holdback-hq1, branch `claude/bold-hawking-k6rktk` (local copy `/Users/nickynicky/holdback-hq`) |
| Live marketing site (Framer) | https://favorite-report-034922.framer.app |
| Framer project | https://framer.com/projects/k9l72FNL3hZy0qrdoNxA |
| Design canvas (8 screens, private) | https://claude.ai/artifact/LoDwZFwXontx6UVkYEf9bT |
| Design research report | `research_notes/Human made dashboard design/Human made dashboard design.md` (notes beside it) |
| Rams design audit | `DESIGN-IS-2026-10-23/` (before 14/30, after the Today redesign 23/30) |

Commits:
1. `688f3cf` Initial build
2. `0bca4d0` Today inbox redesign, sticky dismissals, list + editor approval queue
3. `80f9d51` Cal.com-style light restyle and research report
4. Design follow-ups: adjudication action, past-due wording, Deadlines history, calendar chips, server-side magic link

## Stack

Next.js 14 (App Router, TypeScript strict), Tailwind, Supabase (Postgres, Auth magic link, private Storage, RLS on every table), Groq for extraction and drafting (JSON mode + zod + one retry; disabled unless `GROQ_ACCOUNT_TIER` is `developer` or `enterprise`), pdf-parse with optional Google Vision OCR, Resend for email (only via "Approve and send"), Vercel Cron at `/api/cron/daily` protected by `CRON_SECRET`.

## Key files

- `lib/rules/ontario-construction-act.ts`: every legal timing rule, all `verified: false`. **Values must be verified by an Ontario construction lawyer before client use.**
- `lib/rules/calendar.ts`: business days, Ontario statutory holidays (ESA), Easter.
- `lib/deadlines/engine.ts`: pure deadline engine.
- `lib/sweep.ts`: the daily sweep (overdue flags, holdback dates, WSIB status, deadlines, drafts, 30-day scan purge; dismissed deadlines stay dismissed).
- `lib/metrics.ts`: money at risk, receivables by age, per-payer stats.
- `app/(app)/actions.ts`: every mutation; admin-checked and logged to `activity_log`.
- `supabase/migrations/`: 4 migrations; `supabase/seed.sql` (3 clients, 6 projects, 25 invoices).
- `supabase/tests/`: RLS tests; `npm run test:rls` runs them on a throwaway local Postgres (needs Postgres 15+, no Docker).
- `docs/data-processing-agreement.md`: PIPEDA client DPA template.

## Design system (current)

Light, Cal.com-derived; full token spec at the end of the research report.
- Surfaces `#FFFFFF` / `#F6F7F9` / `#EEEFF2` / `#E5E7EB`; borders `#E5E7EB` and `#D1D5DB`; text `#070A0D` / `#3C3E44` / `#6B7280`.
- Primary button ink `#292929`, radius 10px; no green or purple buttons; borders, not card shadows.
- Status only in badges, each with an icon and a label: paid `#E4FBED`/`#285239`, due soon `#FFEDD6`/`#74331B`, overdue `#F9E3E1`/`#811D1D`, held `#DDE7FD`/`#243C84`.
- Aging ramp `#D1D5DB` → `#FED6A9` → `#FB923C` → `#C2410C` → `#811D1D`.
- Inter for everything with tabular figures; DM Mono only for invoice and certificate numbers.

## Status

- Passing: typecheck, lint, 85 Vitest tests, production build, RLS tests (Postgres 16).
- Checked in a browser against a local Postgres + PostgREST stand-in with seed data (desktop and phone).
- **Not yet tested:** a real Supabase project, real magic-link sign-in, Groq/Vision extraction with real keys, Resend sending, a Vercel deploy.

## Open items

1. Create a Supabase project (ca-central-1), run `supabase db push`, add your email to `agency_admins`, load `seed.sql`.
2. Fill `.env.local` from `.env.example`, deploy to Vercel, set `CRON_SECRET`.
3. Get a lawyer to verify the rules table.
4. Design follow-ups from the audit: done.
   - Adjudication rows on Today: **Review dispute** (invoice editor) and **Payer referred it** (notes the invoice, closes the window, logged).
   - Today splits **Past due** from **Due in the next 14 days**; "overdue" now means invoices only (the stat).
   - `/login` sends the magic link from a server action (first-load JS 167 kB → 97 kB). PKCE verifier is a cookie, so the link must be opened in the same browser. **Still test a real magic link against Supabase.**
   - Deadlines is now Calendar (default) + History (dismissed and cleared items); the open list that duplicated Today is gone. Calendar cells show type + amount, full title on hover.
5. Framer site:
   - optionally connect a custom domain (Site Settings › Domains);
   - prices are $249 / $499 / $899 CAD a month (chosen as reasonable defaults);
   - contact is nicanoruhart@gmail.com / +1 365 737 8872;
   - "Request a scan" opens a pre-filled email.
6. Push the repo to GitHub (no remote yet).

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev
npm run check                # typecheck, lint, tests, build
npm run test:rls
```
