# Verdict: REDESIGN

The interface fails at 14/30, with the load-bearing principles useful (#2), understandable (#4) and honest (#6) all at 1, so the daily workflow is redesigned around one action inbox while the brand tokens, data model and deadline engine are kept.

Scope note: this is a redesign of information architecture and interaction, not of the visual language. The token system, typography roles and engine are sound; the structure that spreads one task across three pages is not.

## Highest-leverage moves

1. **#2 Useful: make the dashboard an action inbox.** Each row is one thing to do today (overdue first, then the next 14 days) with its drafted email and the relevant actions inline: review email, record payment, mark disputed, dismiss. Evidence: dashboard rows link only to project/client (`app/(app)/dashboard/page.tsx:87`); drafts live on a separate 8,884 px page.
2. **#6 Honest: make "dismiss" stick and labels match content.** Add a `dismissed` flag the sweep respects, rename "Resolve" to "Dismiss", and split "Overdue" from "Due in the next 14 days". Evidence: `lib/sweep.ts:121-126` revives resolved rows; `dashboard/page.tsx:72` mislabels overdue items.
3. **#2/#10 Approval queue as list + editor.** A compact list of pending drafts (recipient, amount, days late) beside one editor for the selected draft, instead of 15 stacked forms. Evidence: `/drafts` has 45 fields and 46 buttons.
4. **#4/#10 Replace always-open forms with disclosures and one-line row actions.** Create forms, the delete zone and invoice updates open on demand; recording a payment is an explicit "Record payment" action with labeled fields. Evidence: `clients/[id]/page.tsx:131-184`, `projects/[id]/page.tsx:103-113`.
5. **#3/#8 Close the detail gaps.** Success feedback after every action, page titles on dynamic routes, skip link, `faint` raised to AA, a named display type scale instead of one-off sizes, no wrapping in numeric cells, human rule labels, reduced-motion support. Evidence: E2, E3, E5.
