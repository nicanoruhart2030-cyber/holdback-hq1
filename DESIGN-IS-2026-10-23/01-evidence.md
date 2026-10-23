# Evidence

Collected inline by the orchestrator (no subagents) from source at commit `688f3cf` and from the running app (Next dev on :3100, local Postgres 15 + PostgREST 16.5 + auth/storage stub, `seed.sql` loaded, daily sweep run once: 8 overdue invoices, 40 deadlines, 15 drafts). Viewports: 1440x900 and 375x812.

## E1 Structural

| Fact | Value | Source |
|---|---|---|
| Interactive elements, `/drafts` | 45 fields + 46 buttons in 16 forms; page height 8,884 px | DOM query on `/drafts` |
| Interactive elements, `/projects/[id]` invoice table | 3 controls per row (status select, "Paid" input, Save), 6 rows = 18 | `app/(app)/projects/[id]/page.tsx:103-113` |
| Always-open create forms | Add client (`clients/page.tsx:72-95`), Add project + Add WSIB (`clients/[id]/page.tsx:131-171`), Delete zone (`clients/[id]/page.tsx:174-184`), Record holdback + Project dates (`projects/[id]/page.tsx:186-209`) | source |
| Repeated affordance | Deadline list appears on `/dashboard` and `/deadlines` with different scoping but near-identical columns | `dashboard/page.tsx:72-104`, `deadlines/page.tsx:95-125` |
| Dashboard rows link to the drafted email | No. Rows link to project/client only; draft lives on `/drafts` | `dashboard/page.tsx:87` |
| Max nesting (primary tree) | layout > main > Card > table > tr > td > form > select (8) | `projects/[id]/page.tsx` |
| Dead props / unused imports | 0 (lint clean) | `npm run lint` |

## E2 Visual

| Fact | Value | Source |
|---|---|---|
| Spacing scale | Tailwind 4px grid: 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 40 px | class usage |
| Type scale | 11, 12, 14, 15, 16, 18, 24, 28, 30, 34, 40 px. Four one-off arbitrary sizes: `text-[34px]` (`components/ui.tsx:39`), `text-[28px]` (`ui.tsx:72`), `text-[40px]` (`privacy/page.tsx:19`), `text-[15px]` (`privacy/page.tsx:22`) | grep |
| Distinct colours | 13 tokens (`tailwind.config.ts:9-22`), no orphan hex in components | source |
| Lowest contrast on text | `faint #5A5A6B` on ink: **2.95:1** (fails AA). Used for relative-day labels, "In progress", Privacy link, row hints | computed |
| Other contrast | fg 16.9, muted 5.96, mint 12.1, danger 6.5, warn 11.2, mint-ink on mint 9.9 | computed |
| Table wrapping | Dates break across lines ("Oct 17, / 2026"), client names wrap to 3 lines in Dashboard and Deadlines tables at 1440 px | screenshots `/projects/[id]`, `/deadlines` |
| Grid orphan | 5 stat tiles at 2 cols leave a lone tile at ~800 px | screenshot `/dashboard` at 800 px |
| States | empty: present (`Empty`). loading: present (`(app)/loading.tsx`, generic). error: present (`(app)/error.tsx`). **success: missing** (no confirmation after any save/send/resolve). focus: present (`globals.css:30`). disabled: present (`.btn` disabled styles). | source |
| Page titles | Missing on `/clients/[id]`, `/projects/[id]`, `/scan/[id]` (tab shows "Holdback HQ") | browser tab |
| Mobile | No horizontal overflow at 375 px; nav scrolls horizontally with visible scrollbar and the queue badge is cut off | screenshot |

## E3 Copy and honesty

| Finding | Where |
|---|---|
| **Label/behaviour mismatch:** "Resolve" marks a deadline resolved, but the next daily sweep upserts every live candidate with `resolved: false`, so it comes back | `deadlines/page.tsx:118`, `lib/sweep.ts:121-126` |
| **Label/behaviour mismatch:** card titled "Deadlines in the next 14 days" lists items 105 days overdue first | `dashboard/page.tsx:72`, screenshot |
| Conflicting counts: Overdue tile "8 invoices past the payment window" vs "Next 14 days: 10 / 12 already overdue" (12 includes adjudication, holdback, WSIB) | `dashboard/page.tsx:60-62` |
| Jargon: raw rule ids (`contractor_payment_window`) shown as a column | `deadlines/page.tsx:113` |
| Unclear control: unlabeled number input with placeholder "Paid" beside a status select | `projects/[id]/page.tsx:109` |
| Draft context hidden: amount, days late and deadline are only inside the email body | `drafts/page.tsx:52-77` |
| Every draft ends with the disclaimer | verified on all 15 textareas |
| No superlatives, no dark patterns; destructive delete requires typing the name | source |

## E4 Weight and friction

| Fact | Value | Source |
|---|---|---|
| First-load JS | 96.5 kB most pages; `/login` 167 kB (Supabase browser client) | `next build` output |
| Requests, `/dashboard` | 7 parallel DB queries server-side; 1 document + static chunks client-side | `dashboard/page.tsx:23-31` |
| Idle animations | 0 (only `animate-pulse` in loading skeleton, not gated by `prefers-reduced-motion`) | `(app)/loading.tsx` |
| Modals/badges on load | 0 modals; 1 badge (queue count) | screenshot |
| Dark mode | Dark-only, `color-scheme: dark` set | `globals.css:6` |

## E5 Accessibility

| Fact | Value |
|---|---|
| Landmarks | 4 (aside, nav, main, header) |
| Skip link | **No** |
| Keyboard reachability | All primary actions are native buttons/links/forms: yes. Dropzones have `role=button` + Enter/Space |
| Contrast failures | `faint` token (2.95:1) |
