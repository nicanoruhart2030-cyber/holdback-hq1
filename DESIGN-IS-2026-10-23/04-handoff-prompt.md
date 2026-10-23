# Handoff

The verdict was REDESIGN, so this is the REDESIGN handoff. The user asked for the build in the same run, so moves 1–5 below are already implemented in the commit following `688f3cf` and re-audited at 23/30 (see `05-after.md`). The prompt asks the next plan to verify that work and finish the remaining gaps.

````
/make-plan Redesign Holdback HQ's daily workflow (Next.js 14 App Router + Tailwind + Supabase, repo /Users/nickynicky/holdback-hq). Current design failed a Dieter Rams audit at 14/30 with critical gaps in principles #2 useful, #4 understandable, #6 honest, #10 as little design as possible (all scored 1).

Verdict paragraph:
> The interface fails at 14/30, with the load-bearing principles useful (#2), understandable (#4) and honest (#6) all at 1, so the daily workflow is redesigned around one action inbox while the brand tokens, data model and deadline engine are kept.

Why redesign and not refine: total 14 is below the 20 threshold and three load-bearing principles scored 1; one task (act on money at risk) was split across the dashboard, a separate 8,884 px approval page and per-project tables.

Status: moves 1–5 were implemented in the same session and re-scored at 23/30. This plan must (a) verify each with the checks listed, and (b) complete the "Still open" items.

Preserve from current design:
- Brand tokens: ink #080810, mint #00E5A0, borders over shadows, radius inputs 0 / buttons 8px / cards 12px (tailwind.config.ts, app/globals.css).
- Typography roles: Syne 800 headlines, DM Mono for every number/amount/date (.num), Inter body (app/layout.tsx).
- Deadline engine and rules table, untouched: lib/deadlines/engine.ts, lib/rules/ontario-construction-act.ts (all verified: false).
- Data model and RLS: supabase/migrations/*, supabase/tests/rls.test.sql.

Discard:
- Dashboard as a passive report whose rows link only to project/client. Evidence: old app/(app)/dashboard/page.tsx:87. Caused failure on #2.
- "Resolve" that the next sweep silently reverses. Evidence: lib/sweep.ts upsert set resolved=false on every live candidate. Caused failure on #6.
- Approval queue as 15 stacked full forms (45 fields, 46 buttons). Evidence: old app/(app)/drafts/page.tsx:52-77. Caused failure on #2 and #10.
- Always-open create/delete forms and a three-control update column per invoice row. Evidence: old app/(app)/clients/[id]/page.tsx:131-184, app/(app)/projects/[id]/page.tsx:103-113. Caused failure on #10 and #4.
- Raw rule ids as user-facing labels. Evidence: old app/(app)/deadlines/page.tsx:113. Caused failure on #4.

Top moves (verbatim):
1. #2 Useful: make the dashboard an action inbox. Each row is one thing to do today (overdue first, then the next 14 days) with its drafted email and the relevant actions inline: review email, record payment, mark disputed, dismiss. Evidence: dashboard rows linked only to project/client (app/(app)/dashboard/page.tsx:87); drafts lived on a separate 8,884 px page.
2. #6 Honest: make "dismiss" stick and labels match content. Add a dismissed flag the sweep respects, rename "Resolve" to "Dismiss", and split "Overdue" from "Due in the next 14 days". Evidence: lib/sweep.ts revived resolved rows; dashboard card titled "next 14 days" listed items 105 days overdue.
3. #2/#10 Approval queue as list + editor. A compact list of pending drafts (recipient, amount, days late) beside one editor for the selected draft. Evidence: /drafts had 45 fields and 46 buttons.
4. #4/#10 Replace always-open forms with disclosures and one-line row actions; recording a payment is an explicit "Update" action with labeled fields. Evidence: clients/[id]/page.tsx:131-184, projects/[id]/page.tsx:103-113.
5. #3/#8 Close the detail gaps: success feedback after every action, page titles on dynamic routes, skip link, faint text raised to AA, named display type steps instead of one-off sizes, no wrapping in numeric cells, plain rule labels, reduced-motion support.

Verification for moves 1–5 (run against a seeded database with the sweep run once):
- Today: every row's primary button opens the draft whose deadline_id matches that row.
- Dismiss a row, re-run GET /api/cron/daily, confirm the row stays gone and its pending draft is rejected.
- /drafts: switch between at least three drafts; heading, To and Message must belong to the same draft each time (forms are keyed by id; a regression here sends the wrong email to the wrong payer).
- Send with RESEND_API_KEY unset: nothing sent, draft stays pending with the error shown, error toast.
- Record a partial payment via Update: amount saved, "Payable now" recalculated, editor closes, toast.
- grep -rn "text-\[" app components returns no font-size utilities; contrast of every text token on #080810 is >= 4.5:1.
- npm run check and npm run test:rls pass.

Still open (do these in this plan):
1. #2 Useful: adjudication-window rows route to "Update invoice"; give them a dispute-specific action (view the dispute, record the payer's adjudication referral, or draft a referral notice for approval). Evidence: app/(app)/dashboard/page.tsx Inbox action selection.
2. #4 Understandable: "Overdue 11" (all overdue items) sits beside "8 past the payment window" (invoices only). Use one vocabulary: e.g. "Past due" for the inbox section and "Overdue invoices" for the stat, or count only invoices in both. Evidence: dashboard header and Inbox section titles.
3. #9 Environmentally friendly: /login ships 167 kB first-load JS for the Supabase browser client. Move signInWithOtp to a server action using the @supabase/ssr server client (PKCE verifier stored in cookies) and test a real magic link against a Supabase project before shipping. Evidence: next build output.
4. #10 As little design as possible: the /deadlines list overlaps Today. Keep the calendar and filters; consider making the list view a filtered history (dismissed and resolved items) rather than a second inbox. Evidence: app/(app)/deadlines/page.tsx list view.
5. #3 Aesthetic: calendar cells truncate titles to a few characters; show type + amount instead of the full title, with the title in a tooltip. Evidence: deadlines calendar at 1440 px.
6. Not yet exercised: invoice intake review panel and Cash Leak Scan with real Groq/Vision keys (only the no-AI path was run). Test both with a paid-tier Groq key and sample invoices.

Redesign principles in priority order:
1. #2 Useful — from Today, any item reaches its sendable email or its record-the-outcome form in at most two clicks.
2. #6 Honest — every label says exactly what the action does and what the list contains; nothing the user dismisses or sends silently changes.
3. #10 As little design as possible — each page has one job; forms and destructive actions appear only when asked for.

Deliverables for the plan:
- Information architecture: Today (inbox), Approval queue (list + editor), Clients > Client > Project, Deadlines (calendar + history), Cash Leak Scan, Rules.
- Primary flow, low-fi and labeled, compared side by side with the pre-redesign flow (dashboard → project page → separate drafts page).
- States checklist per page: empty, loading, error, success, focus, disabled.
- Migration path: database migration 20261023000004_deadline_dismissal.sql must be applied before deploying; existing "resolved" rows are not treated as dismissed.
- Cutover criteria: all verification checks above pass on a staging Supabase project with real magic-link sign-in.

Anti-patterns to guard against:
- Porting the old dashboard table under new styling.
- Keeping both the old and new queue behind a flag.
- Redesigning toward a trend instead of the three principles above.
- Treating the Preserve list as optional: tokens, typography roles, engine and RLS stay as they are.
````
