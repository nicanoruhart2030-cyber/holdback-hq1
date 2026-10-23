# Scorecard

Scored by the orchestrator against the per-principle anchors. Tie-breaks go to the lower score; each principle is scored on its worst instance.

1. Good design is innovative — Score: 1/3
   Evidence: Sidebar + stat tiles + tables + stacked forms across every page (E1, E2). The domain model (chained statutory cycles, money-at-risk lens) is novel; the interface is not.
   Justification: a standard admin-dashboard layout with minor variation, not a refreshed pattern with a clear improvement.

2. Good design makes a product useful — Score: 1/3
   Evidence: dashboard rows don't link to the drafted email (E1); approval queue is an 8,884 px scroll of 15 full forms (E1); recording a payment needs a select, an unlabeled input and Save per row (E1, E3).
   Justification: the primary task completes, but only through detours between the dashboard, the queue and project pages.

3. Good design is aesthetic — Score: 1/3
   Evidence: one token system (E2), but four inconsistencies: dates and names wrapping in dense tables, four one-off type sizes outside the scale, a failing `faint` contrast token, and a stat-grid orphan at mid widths (E2).
   Justification: 3–5 inconsistencies; the system is visible but not consistently obeyed.

4. Good design makes a product understandable — Score: 1/3
   Evidence: raw rule ids as a column, conflicting overdue counts (8 vs 12), unlabeled "Paid" input, an ambiguous "Resolve" (E3).
   Justification: 2–3 unclear controls plus jargon on a primary surface.

5. Good design is unobtrusive — Score: 2/3
   Evidence: quiet chrome, borders only, one badge (E2, E4); but always-open create and delete forms fill the lower half of client and project pages (E1).
   Justification: chrome is visible but quiet; the forms compete with content without being decoration.

6. Good design is honest — Score: 1/3
   Evidence: "Resolve" is undone by the next sweep (`lib/sweep.ts:121-126`); "Deadlines in the next 14 days" lists items 105 days overdue (E3).
   Justification: two label/behaviour mismatches; neither is deceptive, so not 0.

7. Good design is long-lasting — Score: 2/3
   Evidence: no gradients, no shadows, no skeuomorphism; Syne 800 wide display is a recognisable early-2020s marker (brief-mandated) (E2).
   Justification: one dated marker.

8. Good design is thorough down to the last detail — Score: 2/3
   Evidence: empty, loading, error, focus and disabled present; success feedback missing everywhere; three pages lack titles; no skip link (E2, E5).
   Justification: one state (success) missing; the other gaps are rough edges rather than missing states.

9. Good design is environmentally friendly — Score: 2/3
   Evidence: 96.5 kB first-load JS on most pages, but `/login` is 167 kB; no idle animation, though the skeleton pulse ignores `prefers-reduced-motion`; dark mode honoured (E4).
   Justification: worst page exceeds 100 kB and motion is not gated, so not 3.

10. Good design is as little design as possible — Score: 1/3
    Evidence: removable elements: Add-client form open by default, Add-project and Add-WSIB forms open by default, permanent delete zone, per-row three-control update column, rule-id column (E1, E3).
    Justification: 3–5 elements could go without breaking any task.

**Total: 14/30.**
