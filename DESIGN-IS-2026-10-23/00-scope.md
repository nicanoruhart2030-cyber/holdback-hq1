# Scope

**Audited:** Holdback HQ web app, commit `688f3cf`, every authenticated page rendered with `supabase/seed.sql` data, plus `/login` and `/privacy`.

Surfaces: `/login`, `/dashboard`, `/clients`, `/clients/[id]` (incl. invoice intake), `/projects/[id]`, `/deadlines` (list + calendar), `/drafts`, `/scan`, `/scan/[id]`, `/settings`, `/privacy`.

Method: production code read in full (`app/`, `components/`, `app/globals.css`, `tailwind.config.ts`), and the running app driven in a browser against a local Postgres + PostgREST stand-in for Supabase, signed in as an agency admin.

**Primary user:** the agency operator (one person or a small team) managing several trade-subcontractor clients.

**Primary task:** each morning, see which client money is at risk and act on it: approve the drafted reminder, record a payment or dispute, or log a new invoice.

**Constraints (from the original brief):**
- Background `#080810`, accent mint `#00E5A0`
- Syne 800 headlines, DM Mono for all numbers/money/dates, Inter body
- Borders over shadows, no box shadows, no purple gradients, no emoji, no shadcn default look
- Radius: inputs 0px, buttons 8px, cards 12px
- Benchmarks: claude.ai and apple.com; dense and clean
- CAD en-CA money, America/Toronto dates
- Stack: Next.js 14 App Router, Tailwind

**User instruction for this run:** "build the ui and the whole thing now". The skill normally ends at a `/make-plan` handoff; because the user asked for the build now, the top moves are also implemented in this session, and the handoff covers whatever remains.

**Reference designs:** claude.ai (quiet chrome, content-first), apple.com (type-led hierarchy, generous restraint).
