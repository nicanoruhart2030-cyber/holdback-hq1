# Trade neon accents for ink and hairlines

Holdback HQ looks AI-generated because its four main choices all sit at the default centre of model output. The near-black #080810 background with a saturated #00E5A0 mint matches what one 2026 critic names as the fallback when a model is told to avoid purple: "near-black with a single acid-green … accent" ([CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)). Syne 800 is the kind of quirky geometric display face that Anthropic says models converge on, the same way they pick Space Grotesk ([Claude blog](https://claude.com/blog/improving-frontend-design-through-skills)). The fix is to rebuild the app on Cal.com's dashboard system:

- **a grayscale token ladder**: a cool-gray light theme and a neutral #0F0F0F dark theme
- **a primary button in ink**: near-black in light mode, white in dark mode
- **hairline borders instead of card shadows**
- **semantic colour confined to small, pale badges**
- **Inter with tabular figures for every number**

Finance and construction tools that people trust use the same restraint. Procore spends its brand orange on the primary button and almost nothing else. Intuit reserves QuickBooks green for the logo. Finance apps default to light mode and offer dark mode through semantic tokens. For Holdback HQ, colour should mean something about money (paid, due soon, overdue, holdback held), never "this is the brand". The full spec is at the end of this report and can be pasted into a token file. One caveat: every Cal.com value below comes from its open-source code. None was measured in a browser.

## The current palette lands in the second-wave AI cluster

The well-documented 2024–2026 tells are Inter and Roboto, indigo accents, purple-to-blue gradients, glows and coloured shadows, heavy rounding, the same shadow on every card, frosted glass, emoji icons and coloured left borders on cards ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website), [Robots on Payroll](https://robotsonpayroll.substack.com/p/how-to-avoid-that-vibe-coded-look)). Indigo is said to have become the default after Tailwind UI shipped `bg-indigo-500` buttons for years, which Tailwind's creator publicly apologised for in 2025 ([prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)). Avoiding indigo does not get you out of the problem. Davenport lists "cream, serif, and terracotta" and "near-black with a single acid-green or vermilion accent" as **replacement clusters that are also defaults** ([CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)). Holdback HQ sits squarely in the second.

Hue is not the problem. Linear and Mercury are both indigo, and GitHub's primary button is green. What separates them from generated UI is saturation and the presence of a system. GitHub's button is a muted **#238636** and Mercury's greens sit at **#188554**. The current #00E5A0 is 100% saturated, roughly two to three times their chroma ([Primer dark.css](https://unpkg.com/@primer/primitives@10.4.0/dist/css/functional/themes/dark.css), [mercury.com](https://mercury.com)).

The mint also causes a functional problem. It is the brand colour and the "positive" colour at once, so every primary button reads as a gain. In an app whose job is to flag overdue receivables, that is backwards.

The user has ruled out green and purple buttons, so the muted-brand-hue option is off the table. That leaves the monochrome pattern used by Vercel and Cal.com. Vercel's primary takes the gray-1000 role: about #171717 in light and #ededed in dark ([Vercel Geist Colors](https://vercel.com/geist/colors)).

## Cal.com builds hierarchy from 3–6% lightness steps, not colour

### Light theme

Cal.com's light theme is Tailwind cool gray with a faint blue tint:

- **Page**: #FFFFFF
- **Sidebar and row hover**: #F6F7F9
- **Item hover**: #EEEFF2
- **Active nav pill**: #E5E7EB
- **Text**: #070A0D for emphasis, #3C3E44 for body, #6B7280 for secondary, #9CA3B0 for muted
- **Borders**: #E5E7EB around containers, #D1D5DB on inputs and secondary buttons

([tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css))

### Dark theme

Dark mode is a **zero-saturation near-black**, not pure black:

- **Page**: #0F0F0F
- **Sidebar**: #171717
- **Hover**: #262626
- **Active**: #404040
- **Text**: #FAFAFA for emphasis, #D4D4D4 for body, #A3A3A3 for secondary

The dark theme has moved darker over time, from #1A1A1A in v4.0.0 to 6% lightness now ([v4.0.0 globals.css](https://raw.githubusercontent.com/calcom/cal.com/v4.0.0/apps/web/styles/globals.css)). This sits in the same band as Linear's #08090a and Vercel's #0a0a0a ([linear.app](https://linear.app), [Vercel Geist Colors](https://vercel.com/geist/colors)). The difference from #080810 is not lightness. It is the visible blue cast that Holdback HQ's background has and these do not.

### Buttons

Cal.com's buttons carry most of its crafted feel:

- **All buttons**: 14px medium text, a **10px radius**, about 32px tall.
- **Primary**: the brand token. By default that is **#292929 with white text in light mode and #FAFAFA with black text in dark mode** ([constants.ts](https://github.com/calcom/cal.com/blob/main/packages/lib/constants.ts), [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx)).
- **Primary shadow**: a layered "physical" stack with a soft drop, a 12% white inset highlight on top, a faint inner shade at the bottom, and a pressed inset state on `:active` ([tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)).
- **Secondary**: white with a #D1D5DB border.
- **Minimal**: borderless subtle text.
- **Destructive**: deliberately quiet. It is an outlined button with #811D1D text that gains a #F9E3E1 fill only on hover. There is no solid red button.

### Elevation and surfaces

Shadows are reserved for buttons, dropdowns and the switch thumb. Lists, tables and cards rely on `border-subtle` alone. The modal backdrop is flat black at 70% with blur explicitly turned off ([tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css), [coss-ui globals.css](https://github.com/calcom/cal.com/blob/main/packages/coss-ui/src/styles/globals.css)).

### Layout

The layout is plain:

- **Sidebar**: 224px wide (56px icon rail at medium widths) on the muted surface, with a gray active pill and no accent colour.
- **Main area**: white with 24px padding.
- **Page header**: sticky, with the title, a subtitle and a right-aligned call to action.
- **Lists and tables**: inside 1px #E5E7EB containers with a 6px radius, hairline row dividers and a #F6F7F9 row hover.
- **Selected row**: marked with a 4px bar in the brand colour on its left edge ([SideBar.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/SideBar.tsx), [Table.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/table/Table.tsx), [BookingListItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/components/booking/BookingListItem.tsx)).

There is a fair objection: near-black-on-white is also shadcn/ui's default, so a monochrome Cal.com clone could read as "unstyled shadcn" ([CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)). The answer is that Cal.com's distinction lives in the details a generator skips:

- the tactile button shadows
- 1.5px icon strokes
- dashed empty-state borders
- a selection colour that matches the brand
- 100–200ms transitions
- domain-specific status semantics

Holdback HQ should copy those details along with the palette.

## Finance and construction tools spend colour only where money moves

The one construction-payments token set that can be verified is Procore's published `@procore/core-css`. Its most common colour is a dark blue-gray text, **#232729**, with 82 uses. Borders are #D6DADC, and blue #2066DF is kept for focus and links. The brand orange **#FF5100 appears just 12 times in a 131 kB stylesheet**, almost all on the primary button and the required-field asterisk ([core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)). Intuit's guidance for QuickBooks is blunter: "Don't use QuickBooks green—it's only reserved for the logo" ([design.intuit.com](https://design.intuit.com/quickbooks/brand/design-foundations/color/)). That rule was seen through a search snippet because the page now redirects, so treat the wording as lightly verified.

Both patterns point the same way for Holdback HQ. Green should mean "paid" or "released" and nothing else.

On light versus dark, Mercury lets users choose Light, Dark or System. When Mercury rebuilt its colour system, it found that inverting a hue-named palette "produced clashing yellows against dull backgrounds". It fixed this with usage-named semantic tokens tuned separately for each theme ([Mercury blog](https://mercury.com/blog/december-2022-product-updates), [Mercury support](https://support.mercury.com/hc/en-us/articles/37538153196948-Enabling-dark-mode)). Procore's legacy CSS has no dark theme at all ([core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)).

For an agency that reconciles receivables and deadlines all day, **light should be the default and dark an opt-in**. The amber "due soon" states need their own dark-mode values rather than inverted ones.

Status should never rely on hue alone. Stripe rebuilt its palette in perceptually uniform CIELAB so every hue carries the same visual weight. Badge text and icons meet WCAG 4.5:1 on each hue's lightest tint, and Stripe shifted badge backgrounds and text up one step to keep contrast even across hues ([Stripe blog](https://stripe.com/blog/accessible-color-systems)). Cal.com's badge pairs already work this way: a pale fill with dark text of the same hue, 12px medium text and a 4px radius ([Badge.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/badge/Badge.tsx)).

Every Holdback HQ pill should therefore carry a text label such as "Overdue 47d", "WSIB expires in 9d" or "Holdback held", ideally with an icon whose shape differs by status. A coloured dot on its own is not enough.

Procore's banners use a coloured left border. Generated card designs use the same device so often that a designer calls it "almost as reliable a sign of AI-generated design as em-dashes" ([Robots on Payroll](https://robotsonpayroll.substack.com/p/how-to-avoid-that-vibe-coded-look)). So Holdback HQ should use a tint plus an icon for banners. The left bar should appear only on the selected table row, as Cal.com does, and always in ink rather than a status hue.

For aging, Siteline is the closest domain analogue. It presents A/R as average invoice aging, billing status and which GCs pay fastest, rather than as decorative charts ([Siteline](https://www.siteline.com/l/subcontractor-billing-software)). No vendor publishes an aging-chart spec. The ramp below is therefore a proposal. It runs from neutral gray to one warm hue and ends in red, and it labels every segment so that hue is never the only cue.

## Distinctiveness belongs in type, not in neon

Human-made products put their character into typography:

- **Linear** uses Inter Variable at non-default weights (**510 / 590 / 680**), Inter Display for headings, negative tracking from −0.011em to −0.022em, and `lining-nums tabular-nums`. Berkeley Mono is kept for code ([linear.app](https://linear.app), [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)).
- **Mercury** uses its custom Arcadia with the Tiempos serif and tabular numerals. IBM Plex Mono appears only five to seven times, against about 60 uses of Arcadia ([mercury.com](https://mercury.com)).
- **GitHub** sets titles in semibold and discourages arbitrary weights like 700 ([Primer typography](https://primer.style/product/getting-started/foundations/typography)).

None of these products sets headings at weight 800 in a quirky display face. None sets every number in monospace, a look that in a finance UI reads as crypto terminal rather than accounting software.

Cal.com runs Inter for the UI and its own Cal Sans SemiBold only for page titles and empty-state headlines. In practice it uses three sizes: **12px** for table headers and badges, **14px** for body, nav, buttons and cells, and **20px** for titles ([layout.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/app/layout.tsx), [Shell.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/Shell.tsx), [Table.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/table/Table.tsx)).

Cal Sans is Cal.com's brand face, and a geometric substitute would recreate the Syne problem. Holdback HQ should instead use **Inter Display at 600 with −0.02em tracking** for titles.

Inter is itself named as a tell for *landing pages* ([Claude blog](https://claude.com/blog/improving-frontend-design-through-skills)). In-product, Linear and Attio show that tuned weights, the Display optical size and correct tracking separate deliberate use from default use ([attio.com](https://attio.com)).

Money goes in the same sans with `tabular-nums`:

- right-aligned columns
- full figures with cents in tables
- compact figures such as $1.2M only on KPI tiles

These are standard accounting conventions. No vendor publishes them as a spec. DM Mono can stay, but only for invoice numbers, WSIB clearance numbers and other identifiers.

## Conclusion

The "AI look" is not one bad colour. It is a stack of choices made at the probability centre: a tinted near-black, a single saturated accent, a quirky display face at heavy weight, and monospace as personality. Removing one layer only moves the app to the neighbouring cluster. What escapes the pattern is a system with named roles in which every colour has a job. For Holdback HQ, ink is for action, gray is for structure, and the four semantic hues are for the state of money and compliance deadlines.

Monochrome primaries are a plain choice, and that plainness pays off here. When the only colour on screen is a red "Overdue 63d" pill or an amber "WSIB expires in 9d" badge, the dashboard does its job before anyone reads a number.

## Implementation-ready token spec

Values marked † are taken directly from Cal.com's source ([tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css), [constants.ts](https://github.com/calcom/cal.com/blob/main/packages/lib/constants.ts)). Unmarked values are derived proposals that fill gaps.

**Surfaces, text and borders**

| Role | Light | Dark |
|---|---|---|
| `bg/page` | #FFFFFF † | #0F0F0F † |
| `bg/muted` (sidebar, row hover, table header band) | #F6F7F9 † | #171717 † |
| `bg/subtle` (item hover) | #EEEFF2 † | #262626 † |
| `bg/emphasis` (active nav pill, gray badge) | #E5E7EB † | #404040 † |
| `bg/inverted` | #070A0D † | #FAFAFA † |
| `text/emphasis` (headings, amounts, active nav) | #070A0D † | #FAFAFA † |
| `text/default` (body, cells) | #3C3E44 † | #D4D4D4 † |
| `text/subtle` (secondary, labels) | #6B7280 † | #A3A3A3 † |
| `text/muted` (placeholder, disabled; never for data) | #9CA3B0 † | #737373 |
| `border/muted` (sidebar edge) | #EEEFF2 † | #171717 † |
| `border/subtle` (containers, row dividers) | #E5E7EB † | #262626 † |
| `border/default` (inputs, secondary buttons) | #D1D5DB † | #4C4C4C † |
| `border/emphasis` | #9CA3B0 † | #737373 † |
| `focus/ring` | 2px rgba(59,130,246,.5) † | 2px rgba(59,130,246,.6) |
| `link` (inline only) | #2563EB | #60A5FA |

Light mode is the default. Dark mode is opt-in through the same semantic token names, tuned per theme and never produced by inverting.

**Buttons** (14px Inter 500, 32px tall, padding 8px 10px, 16px gap-icons at 1.5px stroke, radius 10px†, transition 150ms)

| Variant | Light | Dark |
|---|---|---|
| Primary | bg #292929 †, text #FFFFFF, border #292929; hover #0F0F0F †; disabled opacity .3 † | bg #FAFAFA †, text #000000 †; hover #E5E5E5 (Cal ships #9CA3B0 †; lighter proposed for legibility) |
| Primary shadow (light only) | `0 1px 1px rgba(0,0,0,.08), 0 2px 3px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 1px rgba(0,0,0,.04)`; active `inset 0 2px 1px rgba(0,0,0,.10)` (simplified from †) | none, border only |
| Secondary | bg #FFFFFF, text #3C3E44, border #D1D5DB †; hover bg #F6F7F9, text #070A0D †; shadow `0 1px 2px rgba(0,0,0,.03)` | bg #0F0F0F, text #D4D4D4, border #4C4C4C; hover bg #171717, text #FAFAFA |
| Minimal / ghost | text #6B7280, transparent border; hover bg #EEEFF2, border #E5E7EB, text #070A0D † | text #A3A3A3; hover bg #262626, text #FAFAFA |
| Destructive | outlined: border #D1D5DB, text #811D1D †; hover bg #F9E3E1, border #FEC8C8 †; focus `0 0 0 2px rgba(220,38,38,.15)` † | border #4C4C4C, text #F87272 †; hover bg #230606 †, border #772522 |

There is only one primary button per view. No button uses a status hue as its fill. Use solid red only inside a confirmation dialog, and only if testing shows the outlined destructive button is missed.

**Status badges** (12px Inter 500, padding 4px 6px, radius 4px†, 14px icon, always with a text label)

| Holdback HQ meaning | Light bg / text | Dark bg / text |
|---|---|---|
| Paid · Holdback released · WSIB clearance valid | #E4FBED / #285239 † | #285231 / #E4FBE9 † |
| Due ≤ 14 days · WSIB expiring ≤ 30d · Holdback release window open | #FFEDD6 / #74331B † | #74331B / #FCEFD9 † |
| Overdue · WSIB expired · Lien/holdback deadline missed | #F9E3E1 / #811D1D † | #772522 / #F9E3E1 † |
| Sent · Holdback held · Info | #DDE7FD / #243C84 † | #253883 / #DEE9FC † |
| Draft · Not started · Void | #E5E7EB / #3C3E44 † | #262626 / #D4D4D4 |

Icons: check-circle for paid, clock for due soon, alert-triangle for overdue, lock for held, and dashed-circle for draft. The icon shape carries the status independently of hue. Cal.com's purple badge variant is dropped.

**Aging-bar ramp** (Current / 1–30 / 31–60 / 61–90 / 90+). Each segment is labelled with its bucket and amount. Segments are separated by 2px gaps in `bg/page`.

| Bucket | Light | Dark |
|---|---|---|
| Current | #D1D5DB | #4C4C4C |
| 1–30 | #FED6A9 † | #74331B † |
| 31–60 | #FB923C † | #C2410C |
| 61–90 | #C2410C | #FB923C † |
| 90+ | #811D1D † | #F87272 † |

In dark mode, severity runs toward brighter and more saturated colours. In light mode it runs toward darker ones. Validate both themes with a colour-blindness simulator before shipping.

**Typefaces**

- **UI and numbers**: Inter Variable (`font-feature-settings: "tnum","lnum","cv11"`, `font-variant-numeric: tabular-nums lining-nums`)
- **Titles**: Inter Display at 600
- **Identifiers only** (invoice #, WSIB clearance #, project codes): DM Mono 400 at 13px, or JetBrains Mono
- **Body**: `-webkit-font-smoothing: antialiased` †

**Type scale** (size / line height / weight / tracking)

| Size | Line height | Weight | Tracking | Use |
|---|---|---|---|---|
| 12px | 16px | 500 | 0 | Table headers and nav section labels (uppercase, +0.02em), badges |
| 13px | 20px | 400 | 0 | Meta text and identifiers |
| 14px | 20px | 400/500 | −0.006em | Body, cells, buttons, nav † |
| 16px | 24px | 600 | −0.011em | Section and card titles |
| 20px | 28px | 600 | −0.015em | Page title, Inter Display † |
| 28px | 32px | 600 | −0.02em | KPI figures, tabular, compact format |

No weight above 600 anywhere. Currency columns are right-aligned with cents. Negative amounts are written as −$1,234.56 in `text/default`, with red reserved for the overdue state rather than for every negative number.

**Radii**

| Radius | Use |
|---|---|
| 4px † | Badges, checkboxes |
| 6px † | Tables, lists, inputs |
| 8px † | Cards, empty states, dialogs |
| 10px † | Buttons |
| 9999px | Avatars only |

Nothing larger than 12px.

**Spacing**

- **Grid**: 4px base, on the scale 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 ([Stripe Apps](https://docs.stripe.com/stripe-apps/style))
- **Page padding**: 24px †
- **Card padding**: 24px †
- **Table cells**: padding 8px 12px †, giving about 40px rows
- **Sidebar**: 224px †
- **Nav items**: 32px tall with a 2px gap †

**Shadow policy**

- **Cards, tables, KPI tiles and the sidebar**: no shadows. Use borders and surface steps only.
- **Buttons**: allowed in light mode only, as specified above.
- **Dropdowns and popovers**: `0 5px 20px rgba(0,0,0,.10), 0 10px 40px rgba(0,0,0,.03)` † in light mode. In dark mode use a `border/default` border with `0 8px 24px rgba(0,0,0,.5)`.
- **Modal backdrop**: rgba(0,0,0,.7) with no blur †.
- **Never**: coloured shadows or glows.

## What to remove

- #080810 and its blue-tinted dark surfaces. Replace them with the neutral #0F0F0F / #171717 / #262626 ladder, and make light mode the default.
- #00E5A0 as a button fill, link colour, brand colour or "positive" colour. Mint has no role left. Paid green comes only from the badge pair.
- Syne 800 and any other weight above 600.
- DM Mono on amounts, KPIs and tables. Keep it for identifiers only.
- Glows, coloured box shadows, gradients, frosted glass and backdrop blur.
- Drop shadows on cards, and radii of 16px or more (`rounded-2xl` / `rounded-3xl`).
- Coloured left borders on cards and banners. Use a tint plus an icon. The only left bar allowed is the ink-coloured one on a selected row.
- Status shown by a coloured dot or by hue alone.
- Emoji icons, pill "eyebrow" badges above headings, and marketing verbs ("Unlock", "Seamless") in UI copy.
- Purple and violet anywhere, including Cal.com's purple badge variant and the violet and indigo slots in its chart palette.
