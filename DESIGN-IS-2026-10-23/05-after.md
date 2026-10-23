# After the redesign pass (same session)

The user asked for the build in this run, so the verdict's top five moves were implemented and re-audited against the same running stack (local Postgres + PostgREST, seed data, sweep run).

## What changed

| Move | Change | Files |
|---|---|---|
| 1. Action inbox | `/dashboard` is now **Today**: a one-line summary, four stat tiles, then two lists, "Overdue" and "Due in the next 14 days". Each row shows amount, due date and days late, and one next step: **Review email** (opens that exact draft), **Update invoice**, or **Open**, plus **Dismiss**. The exposure sidebar was removed (per-client totals already live on Clients). | `app/(app)/dashboard/page.tsx`, `components/nav.tsx` |
| 2. Honest dismissal | New `dismissed` columns; the sweep skips dismissed keys and retires their pending drafts. "Resolve" renamed "Dismiss" with a confirm that says it will not come back. | `supabase/migrations/20261023000004_deadline_dismissal.sql`, `lib/sweep.ts`, `app/(app)/actions.ts`, `app/(app)/deadlines/page.tsx` |
| 3. Queue as list + editor | `/drafts` is a sticky list (client, type, amount, days late) beside one editor with the deadline facts in its header. History moved into a disclosure. | `app/(app)/drafts/page.tsx` |
| 4. Forms on demand | `Disclosure` component; Add client / project / WSIB, delete, project dates and holdback forms closed by default (open automatically when the list is empty). Invoice rows have one **Update** action that opens a labeled editor ("Total paid to date", "Dispute notice received"). Holdback release is one confirmed button. | `components/disclosure.tsx`, `app/(app)/clients/**`, `app/(app)/projects/[id]/page.tsx` |
| 5. Detail gaps | Success/error toast after every action (`lib/flash.ts`, `components/flash-toast.tsx`); page titles on dynamic routes; skip link; `faint` raised to `#7C7C94` (4.8:1) and `muted` to `#9A9AAA`; named type steps `stat` / `display` / `display-xl` replace one-off sizes; numeric cells never wrap; plain rule labels in the rules table and UI; `prefers-reduced-motion` honoured; hidden nav scrollbar on phones. | `tailwind.config.ts`, `app/globals.css`, `lib/rules/ontario-construction-act.ts`, `app/(app)/layout.tsx` |

## Bug found and fixed during re-audit

Switching drafts in the new list kept the previous draft's **To** and **Message** in the editor (uncontrolled inputs reused across `?id=` changes), so "Approve and send" could have mailed one payer another payer's reminder. Fixed by keying the `<form>` elements to the record id (drafts editor, invoice editor, deadlines filter). Verified by switching between three drafts: heading, recipient and body matched each time.

## Measured

| | Before | After |
|---|---|---|
| `/drafts` height | 8,884 px | 1,103 px |
| `/drafts` fields / buttons | 45 / 46 | 3 / 4 |
| One-off font sizes | 4 | 0 |
| Lowest text contrast | 2.95:1 | 4.8:1 |
| Pages without a title | 3 | 0 |
| Success feedback | none | every action |
| Dismissed deadline after next sweep | comes back | stays dismissed (verified: 40 → 39 open) |

Flows exercised in the browser: open a draft from Today; attempt send (no Resend configured: nothing sent, draft kept, reason shown, error toast); reject (toast, next draft loads with its own content); dismiss from Today, re-run the sweep, confirm it stays gone; record a partial payment (paid $20,000, payable recalculated, editor closes, toast). Phone width 375 px: no horizontal overflow on Today or the queue.

## Re-score (same rubric, same tie-break rules)

| # | Principle | Before | After | Why |
|---|---|---|---|---|
| 1 | Innovative | 1 | 2 | Deadline → drafted email → one-click review is a refreshed pattern with a clear improvement |
| 2 | Useful | 1 | 2 | Two clicks from Today to a sendable email; adjudication rows still route to a generic invoice update |
| 3 | Aesthetic | 1 | 2 | One system obeyed; calendar cells still truncate titles heavily |
| 4 | Understandable | 1 | 2 | Plain labels; "Overdue 11" (all items) beside "8 past the payment window" (invoices) still needs a second read |
| 5 | Unobtrusive | 2 | 3 | Forms and destructive actions recede until asked for |
| 6 | Honest | 1 | 3 | Dismiss sticks; section titles match contents; confirms state consequences |
| 7 | Long-lasting | 2 | 2 | Syne 800 wide display remains (required by the brief) |
| 8 | Thorough | 2 | 3 | Empty, loading, error, success, focus, disabled all present; titles and skip link added |
| 9 | Environmentally friendly | 2 | 2 | Motion gated now; `/login` still 167 kB first-load JS |
| 10 | As little design as possible | 1 | 2 | Sidebar, rule-id column and open forms gone; Deadlines list still overlaps Today |
| | **Total** | **14** | **23** | |

23/30 with no zeros would now read as **REFINE** on the Phase 3 rule. The remaining moves are in `04-handoff-prompt.md`.
