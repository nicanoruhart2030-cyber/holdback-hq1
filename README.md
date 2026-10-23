# Holdback HQ

Internal ops app for an agency managing Ontario trade subcontractors: prompt-payment deadlines, holdback releases and WSIB clearances under the Construction Act (2026 rules), with AI invoice intake, an approval-gated reminder queue and a prospect "Cash Leak Scan".

> **All legal timing values in `lib/rules/ontario-construction-act.ts` ship with `verified: false` and must be verified by an Ontario construction lawyer before client use.**

Stack: Next.js 14 (App Router, TypeScript strict), Tailwind, Supabase (Postgres, Auth, Storage, RLS), Groq, pdf-parse, Google Cloud Vision (optional), Resend, Vercel Cron.

## Layout

| Path | What |
|---|---|
| `lib/rules/ontario-construction-act.ts` | Every legal timing rule, one typed table |
| `lib/rules/calendar.ts` | Business days, Ontario statutory holidays, Easter |
| `lib/deadlines/engine.ts` | Pure deadline engine (no I/O) |
| `lib/sweep.ts` | Daily sweep: overdue flags, holdback dates, WSIB status, deadlines, drafts, scan purge |
| `lib/scan/` | Cash Leak Scan report model and PDF export |
| `lib/ai/` | Groq JSON client (zod + one retry), extraction, drafting, data minimization |
| `app/(app)/actions.ts` | All mutations; admin-checked and written to `activity_log` |
| `supabase/migrations/` | Schema, RLS, storage bucket and policies |
| `supabase/tests/` | RLS tests and a Docker-free local runner |
| `docs/data-processing-agreement.md` | PIPEDA client DPA template |

## Local setup

Requires Node 20+ and a Supabase project (hosted or `supabase start`).

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see comments in the file). Then:

```bash
npm run dev
```

AI extraction and drafting are off until `GROQ_API_KEY` is set **and** `GROQ_ACCOUNT_TIER` is `developer` or `enterprise`. Without them, intake still uploads and previews documents and you type the fields; drafts use built-in templates.

## Supabase setup

1. Create a project in **ca-central-1 (Canada)** so data stays in Canada.
2. Install the CLI and link: `supabase link --project-ref <ref>`.
3. Apply migrations: `supabase db push`.
4. Make yourself an agency admin **before your first sign-in** (SQL editor):
   ```sql
   insert into public.agency_admins (email) values ('you@youragency.ca');
   ```
   If you already signed in: `update public.profiles set role = 'admin' where email = 'you@youragency.ca';`
5. Load demo data (optional): paste `supabase/seed.sql` into the SQL editor, or `psql "$DATABASE_URL" -f supabase/seed.sql`.
6. Auth > URL configuration: set Site URL to your app URL and add `<app-url>/auth/callback` as a redirect URL. Magic links are on by default.
7. Generate the first deadlines and drafts: sign in and click **Run sweep now** on the dashboard, or call the cron endpoint (below).

To give a subcontractor read-only access to their own data, have them sign in once, then set `profiles.client_id` to their client's id.

## Vercel deploy and cron

1. Import the repo in Vercel (framework: Next.js).
2. Add every variable from `.env.example` to the project's environment variables. Set `NEXT_PUBLIC_APP_URL` to the production URL.
3. Generate `CRON_SECRET` (e.g. `openssl rand -hex 32`). Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>` to cron routes.
4. `vercel.json` schedules `/api/cron/daily` at `0 10 * * *` UTC (06:00 Toronto in summer, 05:00 in winter). Cron jobs run on production deployments only.
5. Verify a deployment directly:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/daily
   ```

The sweep never sends email. It only creates drafts in the approval queue; email goes out only when an admin clicks **Approve and send**.

## Tests and checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm test            # Vitest: every rule, holidays 2026/2027, weekends, engine, scan report
npm run build       # production build
npm run check       # all four in sequence
```

RLS tests run against a throwaway local Postgres (15+, no Docker) with a small Supabase shim:

```bash
npm run test:rls
```

To run them against a real Supabase database instead (the test file rolls back everything it does; seed must be loaded):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.test.sql
```

## Privacy

See `/privacy` in the app and `docs/data-processing-agreement.md`. Documents live in a private bucket and are only served through 5-minute signed URLs. Text sent to Groq is minimized and banking/SIN/card numbers are redacted. Prospect scan data is purged by the daily sweep after 30 days unless converted.
