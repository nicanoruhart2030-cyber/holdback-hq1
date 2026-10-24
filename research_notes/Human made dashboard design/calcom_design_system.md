# Cal.com Web App Dashboard: Visual Design System (2025–2026)

Method note: everything below comes from the open-source repo `calcom/cal.com`, read at `main` commit `0f19cc46ef6b6426ee398c670575b3c96be7af9e` (committed 2026-10-19), and compared against tags `v4.0.0` and `v5.5.0`. The repo writes tokens as `hsla()`. I converted them to hex with a script, so a hex value can be off by about 1 in a channel because the source percentages are rounded. Nothing here comes from screenshots. Anything I did not read directly in code is marked **inferred**.

Main source files (links to `main`):
- Tokens: [packages/config/theme/tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- App global CSS: [apps/web/styles/globals.css](https://github.com/calcom/cal.com/blob/main/apps/web/styles/globals.css)
- coss-ui layer, a newer shadcn-style kit being merged in: [packages/coss-ui/src/styles/globals.css](https://github.com/calcom/cal.com/blob/main/packages/coss-ui/src/styles/globals.css)
- Button: [packages/ui/components/button/Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx)
- Badge: [packages/ui/components/badge/Badge.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/badge/Badge.tsx)
- Empty state: [packages/ui/components/empty-screen/EmptyScreen.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/empty-screen/EmptyScreen.tsx)
- Table: [packages/ui/components/table/Table.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/table/Table.tsx)
- Sidebar: [apps/web/modules/shell/SideBar.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/SideBar.tsx); nav items: [apps/web/modules/shell/navigation/NavigationItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/navigation/NavigationItem.tsx)
- Page shell and header: [apps/web/modules/shell/Shell.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/Shell.tsx)
- Fonts: [apps/web/app/layout.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/app/layout.tsx), [packages/ui/styles/shared-globals.css](https://github.com/calcom/cal.com/blob/main/packages/ui/styles/shared-globals.css)
- Brand colour override: [packages/lib/getBrandColours.tsx](https://github.com/calcom/cal.com/blob/main/packages/lib/getBrandColours.tsx), [packages/lib/constants.ts](https://github.com/calcom/cal.com/blob/main/packages/lib/constants.ts) (lines ~162–163), [apps/web/modules/shell/useAppTheme.ts](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/useAppTheme.ts)

## What are Cal.com's actual colour tokens (light and dark)?

### Takeaway
The token system is grayscale. In light mode it is Tailwind's cool gray scale (gray-50…gray-900). In dark mode it is a neutral, zero-saturation scale whose page background is #0F0F0F (6% lightness), so dark mode is a soft near-black and not pure black. Colour appears only in small semantic badge and alert pairs (a pale fill with dark text of the same hue) and in a separate chart palette. The "brand" colour is near-black in light mode and white in dark mode.

### Cited Findings
Token architecture
- Tokens are CSS custom properties (`--cal-*`) on `:root, :host` for light and `.dark` for dark mode. A Tailwind v4 `@theme inline` block maps them to utility names: `bg-default`, `bg-subtle`, `bg-emphasis`, `bg-cal-muted`, `border-subtle`, `text-emphasis`, `text-subtle`, `text-muted` and so on. Comments call the system "Cal.diy". — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- Tailwind v4 has replaced the older `packages/config/tailwind-preset.js` (Tailwind v3) on `main`. The preset still exists at v5.5.0 and maps the same `--cal-*` variables. — [v5.5.0 tailwind-preset.js](https://raw.githubusercontent.com/calcom/cal.com/v5.5.0/packages/config/tailwind-preset.js)
- At v5.5.0 the token values lived in `apps/web/styles/globals.css`, with comments naming the Tailwind source: "gray.200 - active items and emphasising", "gray.50 - large items, sidebar, sections", "gray.300 - inputs", "gray.200 - container borders", "stone-950" for the dark background. The values match current `main`. — [v5.5.0 apps/web/styles/globals.css](https://raw.githubusercontent.com/calcom/cal.com/v5.5.0/apps/web/styles/globals.css)

LIGHT mode (`:root`), [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)

| Token (utility) | hsla in source | Hex | Role |
|---|---|---|---|
| `--cal-bg` (`bg-default`) | 0,0%,100% | #FFFFFF | page / main content |
| `--cal-bg-muted` (`bg-cal-muted`) | 210,20%,97% | #F6F7F9 | sidebar, sections, row hover |
| `--cal-bg-subtle` (`bg-subtle`) | 220,14%,94% | #EEEFF2 | hover on items, subtle raise |
| `--cal-bg-emphasis` (`bg-emphasis`) | 220,13%,91% | #E5E7EB | active nav item, gray badge, empty-state icon circle |
| `--cal-bg-inverted` | 210,30%,4% | #070A0D | inverted surfaces |
| `--cal-border-muted` | 220,14%,94% | #EEEFF2 | sidebar right border |
| `--cal-border-subtle` (`border-subtle`) | 220,13%,91% | #E5E7EB | container/card/list borders, row dividers |
| `--cal-border` (`border-default`) | 216,12%,84% | #D1D5DB | inputs, secondary buttons |
| `--cal-border-emphasis` | 218,11%,65% | #9CA3B0 | strong borders |
| `--cal-text-emphasis` (`text-emphasis`) | 210,30%,4% | #070A0D | headings, active nav, primary text |
| `--cal-text` (`text-default`) | 220,6%,25% | #3C3E44 | body text |
| `--cal-text-subtle` (`text-subtle`) | 220,9%,46% | #6B7280 | secondary text, minimal buttons |
| `--cal-text-muted` (`text-muted`) | 218,11%,65% | #9CA3B0 | tertiary/placeholder |
| `--cal-brand` (`bg-brand-default`) | 221,39%,11% | #111827 | primary button fill (default token; see override below) |
| `--cal-brand-emphasis` | 0,0%,6% | #0F0F0F | primary hover |
| `--cal-brand-text` | 0,0%,100% | #FFFFFF | text on primary |
| `--cal-bg-primary` / `--cal-bg-brand` | 214,30%,16% | #1D2735 | |
| `--cal-bg-primary-emphasis` | 220,6%,25% | #3C3E44 | |

Light semantic (badge/alert) pairs. These are the "legacy" tokens that `Badge` uses:
| Use | bg token → hex | text token → hex |
|---|---|---|
| attention / orange / warning (Badge default) | `--cal-bg-attention` #FFEDD6 | `--cal-text-attention` #74331B |
| success / green | `--cal-bg-success` #E4FBED | `--cal-text-success` #285239 |
| info / blue | `--cal-bg-info` #DDE7FD | `--cal-text-info` #243C84 |
| error / red | `--cal-bg-error` #F9E3E1 | `--cal-text-error` #811D1D |
| gray | `--cal-bg-emphasis` #E5E7EB | `--cal-text-emphasis` #070A0D |

Newer "semantic" set (light): info subtle #F1F7FE / emphasis #0D1473; success subtle #E4F7F3 / emphasis #19A974, success text #096738; attention subtle #FFEDD6 / emphasis #9B3412; error subtle #FEE1E1 / emphasis #641717; error border #FEC8C8; attention-subtle border #FED6A9. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)

DARK mode (`.dark`), [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)

| Token | hsla | Hex |
|---|---|---|
| `--cal-bg` | 0,0%,6% | #0F0F0F (page; near-black, not #000) |
| `--cal-bg-muted` | 0,0%,9% | #171717 (sidebar, row hover) |
| `--cal-bg-subtle` | 0,0%,15% | #262626 |
| `--cal-bg-emphasis` | 0,0%,25% | #404040 (active nav) |
| `--cal-bg-inverted` | 0,0%,98% | #FAFAFA |
| `--cal-border-muted` | 0,0%,9% | #171717 |
| `--cal-border-subtle` | 0,0%,15% | #262626 |
| `--cal-border` | 0,0%,30% | #4C4C4C |
| `--cal-border-emphasis` | 0,0%,45% | #737373 |
| `--cal-text-emphasis` | 0,0%,98% | #FAFAFA |
| `--cal-text` | 0,0%,83% | #D4D4D4 |
| `--cal-text-subtle` | 0,0%,64% | #A3A3A3 |
| `--cal-text-muted` | 0,0%,64% | #A3A3A3 (same as subtle in dark) |
| `--cal-brand` | 0,0%,100% | #FFFFFF (primary button = white) |
| `--cal-brand-emphasis` | 218,11%,65% | #9CA3B0 |
| `--cal-brand-text` | 0,0%,0% | #000000 |
| `--cal-bg-primary` | 0,0%,96% | #F5F5F5 |

Dark semantic pairs (legacy, used by Badge): info bg #253883 / text #DEE9FC; success bg #285231 / text #E4FBE9; attention bg #74331B / text #FCEFD9; error bg #772522 / text #F9E3E1. Newer semantic set (dark): info text #8197F8, success text #50C39F, attention text #FB923C, error text #F87272, subtle fills #040625 / #054D26 / #260F03 / #230606. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)

- Text selection uses the brand colour: `::selection { color: var(--cal-brand-text); background: var(--cal-brand); }`, so selections are black in light mode and white in dark mode. — [apps/web/styles/globals.css](https://github.com/calcom/cal.com/blob/main/apps/web/styles/globals.css)
- A standalone `--color-black: #111111` is defined. The default focus ring colour is `rgb(59 130 246 / 0.5)`, a Tailwind blue. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- Chart/visualization palette, the only saturated hues (light "emphasis"): pink #EC4899-ish (330,81%,60%), violet (256,85%,57%), indigo (235,100%,63%), green (158,74%,38%), yellow (45,93%,47%), orange (25,95%,53%), red (0,84%,60%). Each has a pale "subtle" partner. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- The coss-ui layer (shadcn-style, now inside the repo) uses alpha-based tokens. Light: border = black at 8%, input = black at 10%, secondary/muted/accent = black at 4%, primary = neutral-800, sidebar = neutral-50, sidebar-border = black at 6%. Dark: background = neutral-950 mixed 96% with white, border = white at 6%, input = white at 8%. Its `--radius` is 0.625rem (10px). — [coss-ui globals.css](https://github.com/calcom/cal.com/blob/main/packages/coss-ui/src/styles/globals.css)

Version changes
- v4.0.0 (2024) had slightly different values. Light: bg-subtle hsl(220,14%,96%) ≈ #F3F4F6, bg-muted hsl(210,20%,98%) ≈ #F9FAFB, and text-emphasis and text were both hsl(217,19%,27%) ≈ #374151. Dark: bg hsl(0,0%,10%) ≈ #1A1A1A, bg-muted 12%, bg-subtle 18%, border 34%, border-subtle 22%. By v5.5.0 and on current main, the dark theme moved darker (6% / 9% / 15%) and light emphasis text moved to near-black #070A0D. — [v4.0.0 globals.css](https://raw.githubusercontent.com/calcom/cal.com/v4.0.0/apps/web/styles/globals.css), [v5.5.0 globals.css](https://raw.githubusercontent.com/calcom/cal.com/v5.5.0/apps/web/styles/globals.css)
- The ToDesktop (desktop app) build overrides `--cal-bg-emphasis` with translucent values (light hsla(0,0%,11%,0.1), dark hsla(220,2%,26%,0.3)) and makes `main` translucent for macOS vibrancy. — [apps/web/styles/globals.css](https://github.com/calcom/cal.com/blob/main/apps/web/styles/globals.css)

### Inferences
- The light theme is Tailwind cool gray with a faint blue tint (hue 210–220). The dark theme is pure neutral gray (0% saturation), so the two modes differ in tint as well as lightness.
- The ladder is page #FFF, then a muted surface (#F6F7F9), then hover (#EEEFF2), then active (#E5E7EB). Separation is done with 3–6% lightness steps, never with colour.

### Gaps
- The tokens.css on `main` has no explicit `--cal-text-semantic-*-emphasis` values for light mode, only for dark. I did not check whether light uses fallbacks.
- `--cal-brand-subtle` has no defined value in tokens.css. It falls back to `#9CA3AF` through `@theme` and is set at runtime by `getBrandColours`.

## What colour is the primary button, and how are secondary/minimal/destructive styled?

### Takeaway
Primary is a solid near-black button in light mode and a white button with black text in dark mode. All buttons are 14px medium weight with a 10px radius, about 32px tall at the default size, with layered "physical" shadows (an inset top highlight and a bottom inner shade). Secondary is white with a 1px gray-300 border and a faint drop shadow. Minimal is borderless subtle text. Destructive is an outlined button with red text that gains a pale red fill on hover; it has no solid red fill.

### Cited Findings
- Base classes for every button: `inline-flex items-center text-sm font-medium rounded-[10px] transition gap-1`. — [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx)
- Sizes: `xs: h-6 p-2 text-xs rounded-md`; `sm: h-7 px-2 py-1.5 text-sm leading-none`; `base: px-2.5 py-2 text-sm leading-none` (with `md:px-4 md:py-2.5` for the `fab` variant); `lg: px-3 py-2.5`. Icon buttons: base `min-h-[36px] min-w-[36px]`, sm `h-6 w-6 rounded-md`, xs `h-5 w-5`, lg `h-10 w-10`. Start icons are `h-4 w-4 stroke-[1.5px]`. — [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx)
- **Primary**: `bg-brand-default text-brand border border-brand-default hover:bg-brand-emphasis shadow-button-solid-brand-default`, with hover, active and focused shadow variants and `disabled:opacity-30`. — [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx)
- Primary shadow (rest): `0 2px 3px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.08), 1px 4px 8px rgba(0,0,0,.12), inset 0 2px 0.4px rgba(255,255,255,.12), inset 0 -3px 2px rgba(0,0,0,.04)`. Active: `inset 0 3px 1px rgba(0,0,0,.10), inset 0 0 2px rgba(0,0,0,.10)` (a pressed-in look). Focused adds a two-ring halo: `0 0 0 1px rgba(255,255,255,.40), 0 0 0 2px rgba(0,0,0,.20)`. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- The dashboard primary colour is the user's brand colour by default. `useAppTheme` calls `getBrandColours({lightVal: user.brandColor, darkVal: user.darkBrandColor})`, which rewrites `--cal-brand`, `--cal-brand-emphasis`, `--cal-brand-subtle` and `--cal-brand-text` (chosen for WCAG contrast). The defaults are `DEFAULT_LIGHT_BRAND_COLOR = "#292929"` and `DEFAULT_DARK_BRAND_COLOR = "#fafafa"`. — [useAppTheme.ts](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/useAppTheme.ts), [getBrandColours.tsx](https://github.com/calcom/cal.com/blob/main/packages/lib/getBrandColours.tsx), [constants.ts](https://github.com/calcom/cal.com/blob/main/packages/lib/constants.ts)
- **Secondary**: `bg-default text-default border border-default` (#D1D5DB in light), `hover:bg-cal-muted hover:text-emphasis`, `shadow-outline-gray-rested` = `0 2px 3px rgba(0,0,0,.03), 0 2px 2px -1px rgba(0,0,0,.03)`, active `inset 0 2px 1px rgba(0,0,0,.05)`. — [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx), [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- **Minimal**: `text-subtle border border-transparent`; on hover `bg-subtle text-emphasis border-subtle`. It has no resting shadow. — [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx)
- **Destructive**: `border border-default text-error` (#811D1D), `hover:bg-error` (#F9E3E1) `hover:border-semantic-error` (#FEC8C8), and a red-tinted focus ring `0 0 0 2px rgba(220,38,38,.15)`. — [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx), [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- Change history: at v4.0.0 the buttons were `rounded-md` (6px) with `base: h-9 px-4 py-2.5` (36px), a flat brand fill and a `ring-2` focus ring, without the layered shadows. The 10px radius and skeuomorphic shadows were already present by v5.5.0. — [v4.0.0 Button.tsx](https://raw.githubusercontent.com/calcom/cal.com/v4.0.0/packages/ui/components/button/Button.tsx), [v5.5.0 Button.tsx](https://raw.githubusercontent.com/calcom/cal.com/v5.5.0/packages/ui/components/button/Button.tsx)
- The coss-ui button (newer components) is `rounded-lg border font-medium sm:text-sm`, with default height `h-9 sm:h-8` (36/32px), sm `h-8 sm:h-7`, lg `h-10 sm:h-9`, `disabled:opacity-64`, icons `size-4` at 80% opacity. — [coss-ui button.tsx](https://github.com/calcom/cal.com/blob/main/packages/coss-ui/src/components/button.tsx)

### Inferences
- With `text-sm leading-none` (14px line), 8px vertical padding and a 1px border on each side, the base button is about 32px tall (**inferred** from the classes, not measured).
- In light mode the primary looks like dark charcoal (#292929 by default, or #111827 if no user colour applies) rather than pure black. The shadow stack gives it a subtly pressed, tactile look.

### Gaps
- I did not measure rendered heights in a browser.

## Which typefaces, sizes and weights?

### Takeaway
UI text is Inter (variable). Cal Sans SemiBold is used only for display headings: the page title, empty-state headlines and similar. The type scale is small and dense. Page titles are 20px Cal Sans semibold with wide tracking. Body, nav, buttons and table cells are 14px (`text-sm`) medium or regular. Table headers and section labels are 12px uppercase medium or semibold.

### Cited Findings
- `Inter` from `next/font/google` sets `--font-sans` (followed by `system-ui`). `CalSans-SemiBold.woff2` from `next/font/local` sets `--font-cal`. — [apps/web/app/layout.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/app/layout.tsx)
- Legacy `@font-face` rules declare "Cal Sans" (`/fonts/cal.ttf`) and "Inter var" (weights 100–900). — [shared-globals.css](https://github.com/calcom/cal.com/blob/main/packages/ui/styles/shared-globals.css)
- The body uses `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility`. — [apps/web/styles/globals.css](https://github.com/calcom/cal.com/blob/main/apps/web/styles/globals.css)
- Page title (`ShellMain`): `<h3 class="font-cal text-emphasis text-lg sm:text-xl font-semibold tracking-wide truncate">` (`text-base` when `smallHeading` is set). Subtitle: `text-default text-sm`. — [Shell.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/Shell.tsx)
- Empty-state headline: `font-cal text-emphasis text-xl text-center`. Description: `text-default text-sm font-normal leading-6`. — [EmptyScreen.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/empty-screen/EmptyScreen.tsx)
- Nav items: `text-sm font-medium text-default`. Nav section label: `text-subtle px-2 text-xs font-semibold uppercase tracking-wide`. — [NavigationItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/navigation/NavigationItem.tsx)
- Table header: `text-default p-3 text-left text-xs font-medium uppercase`. Table cell: `text-default px-3 py-2 text-sm font-medium`. — [Table.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/table/Table.tsx)
- Booking row: the date and time use `text-emphasis text-sm leading-6`, and secondary lines use `text-subtle text-sm`. Dropdown section labels use `text-xs font-medium uppercase`. — [BookingListItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/components/booking/BookingListItem.tsx)
- Badge text: md is `text-xs leading-none font-medium`, sm is `text-[10px]`, lg is `text-sm`. — [Badge.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/badge/Badge.tsx)

### Inferences
- Effectively there are only three sizes (12 / 14 / 20px) and two weights (400 / 500, plus Cal Sans semibold for titles). That restraint accounts for much of the calm feel.

### Gaps
- Cal Sans is Cal.com's own brand typeface (open-licensed per Cal.com's public statements, but I did not verify that here). To reproduce the feel without the brand, use a geometric grotesk display face only for headings.

## How does the dashboard lay out (sidebar, header, rows, hover, badges)?

### Takeaway
The layout has a fixed left sidebar 224px wide (56px icon rail at md) on the muted gray surface, separated by a 1px muted border. The main area is white with 24px padding. A sticky page header holds the Cal Sans title, a small subtitle and a right-aligned CTA. Lists are bordered rounded containers with hairline row dividers and a muted-gray hover. They do not use shadowed cards.

### Cited Findings
- Sidebar: `<aside class="fixed hidden h-full w-14 flex-col border-muted border-r bg-cal-muted md:sticky md:flex lg:w-56 lg:px-3">`, with inner `py-3 lg:pt-4`. That is 56px at md and 224px at lg, with 12px horizontal padding. — [SideBar.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/SideBar.tsx)
- Nav item: `group flex items-center rounded-md px-2 py-1.5 text-sm font-medium text-default mt-0.5 hover:bg-subtle hover:text-emphasis [&[aria-current='page']]:bg-emphasis [&[aria-current='page']]:text-emphasis`. Icon: `h-4 w-4 mr-2`. The active state is a gray-200 pill (#E5E7EB light, #404040 dark) and carries no accent colour. — [SideBar.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/SideBar.tsx), [NavigationItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/navigation/NavigationItem.tsx)
- Main: `<main class="bg-default relative z-0 flex-1">` with `<div class="max-w-full p-2 sm:p-4 lg:p-6">`. — [Shell.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/Shell.tsx)
- Page header: `bg-default sticky top-0 z-10 flex items-center md:mb-6 lg:mb-8` (`lg:mb-7` with smallHeading). The back button is a minimal icon button. On mobile the CTA floats `fixed bottom-20 right-4`, and from md up it sits inline at the right. — [Shell.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/Shell.tsx)
- List container pattern (Event Types): `<ul class="border-subtle bg-default divide-subtle divide-y rounded-md border">`, a 1px #E5E7EB border with 6px radius and hairline dividers. — [event-types SkeletonLoader.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/event-types/components/SkeletonLoader.tsx)
- Table: wrapper `bg-default border-subtle overflow-x-auto rounded-md border`; `<table class="divide-subtle w-full divide-y">`; `<tbody class="divide-subtle divide-y">`; header row `bg-default`. — [Table.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/table/Table.tsx)
- Booking row: `group relative w-full transition-all duration-100 ease-out hover:bg-cal-muted`. The selected row adds `bg-cal-muted` plus a 4px left bar in brand colour (`before:w-1 before:bg-brand-default`). An event-type colour shows as a 2px vertical stripe (`h-[70%] w-0.5`). Cells use `py-4` (16px vertical) and the date column is `sm:min-w-48`. — [BookingListItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/components/booking/BookingListItem.tsx)
- Settings and section cards: `rounded-lg border border-subtle p-6` (8px radius, 24px padding). Stacked sections join with `border-t-0` and `rounded-b-lg`. — [EventAdvancedTab.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/event-types/components/tabs/advanced/EventAdvancedTab.tsx)
- Badge: `font-medium inline-flex items-center rounded-[4px] gap-x-1`, with md `py-1 px-1.5 text-xs leading-none` (about 20px tall), an optional 8px dot or icon, and `rounded` giving a 20px circle. The default variant is attention/orange. Variants: success/green, gray, blue, red/error, purple (`bg-purple-50 text-purple-800`). — [Badge.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/badge/Badge.tsx)
- Empty state: `rounded-lg border border-dashed border-subtle p-7 lg:p-20`, centred. The icon sits in a 72px `bg-emphasis` circle with a 40px icon at `stroke-[1.3px]`. The text block is `max-w-[420px]` with one default button. — [EmptyScreen.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/empty-screen/EmptyScreen.tsx)
- Radii scale: sm 2px, default 4px, md 6px, lg 8px, xl 12px, 2xl 16px, 3xl 24px. Buttons use 10px, badges 4px, lists and tables 6px, cards and empty states 8px. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)

### Inferences
- Booking rows are about 72–80px tall (16px padding top and bottom around two 24px lines). **Inferred** from the classes.
- Nav items are about 32px tall (6px padding top and bottom around a 20px line) with 2px gaps between them. **Inferred**.

### Gaps
- I did not extract the exact class strings of the Event Types list item on current main. Event-type rows appear to come from `packages/platform/atoms/event-types/components/EventTypeListItem.tsx` and the infinite list, which I did not read. The container pattern above comes from the skeleton loader that mirrors the list.

## What gives it a "human-made", crafted feel? Shadows? Use of colour?

### Takeaway
The crafted feel comes from three things. Colour is held back: the UI is grayscale, the only accent is the near-black or white brand fill, and hue appears only in small semantic badges. Hierarchy uses hairline borders and 3–6% lightness steps instead of drop shadows. Shadows are reserved for buttons, which get multi-layer "tactile" shadows with inset highlights, and for dropdowns.

### Cited Findings
- Defined shadows are limited to dropdowns, the switch thumb, buttons (solid and outline, each with rest, hover, active and focused states) and one `elevation-low`. Containers, lists and cards rely on `border-subtle` alone. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- Dropdown shadow: `0 5px 20px rgba(0,0,0,.10), 0 10px 40px rgba(0,0,0,.03)`. `elevation-low`: `0 1px 1px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.08), 0 2px 2px rgba(0,0,0,.10), 0 0 8px rgba(0,0,0,.05)`. Switch thumb: `0 .8px .8px rgba(0,0,0,.10), 0 .8px 3.2px rgba(0,0,0,.08)`. — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- The active nav state is a gray pill, not a coloured one, and the selected booking row uses a brand-coloured (near-black) 4px left bar. — [NavigationItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/modules/shell/navigation/NavigationItem.tsx), [BookingListItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/components/booking/BookingListItem.tsx)
- Micro-details found in code:
  - Icons are thin: 1.5px stroke in buttons, 1.3px in empty states.
  - Empty states use dashed borders.
  - Text selection takes the brand colour.
  - Transitions are fast, 100–200ms.
  - Buttons get a pressed inset shadow on `:active`.
  - Page titles use `tracking-wide`.
  - The modal backdrop is `bg-black/70` with blur turned off: `.backdrop-blur-sm { @apply backdrop-blur-none bg-black/70 }`.
  — [Button.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/button/Button.tsx), [EmptyScreen.tsx](https://github.com/calcom/cal.com/blob/main/packages/ui/components/empty-screen/EmptyScreen.tsx), [coss-ui globals.css](https://github.com/calcom/cal.com/blob/main/packages/coss-ui/src/styles/globals.css)
- Inline links inside booking rows are the one place blue appears as an interactive colour (`text-blue-600 hover:underline dark:text-blue-400`). — [BookingListItem.tsx](https://github.com/calcom/cal.com/blob/main/apps/web/components/booking/BookingListItem.tsx)

### Inferences
- To reproduce the feel without the brand:
  - Use a cool-gray light scale and a neutral 0%-saturation dark scale.
  - Use one ink-coloured primary button with a soft multi-layer shadow and a top inner highlight.
  - Use 1px borders at gray-200 for containers and gray-300 for inputs.
  - Use a muted sidebar surface one step off the white page.
  - Keep a three-size type scale, with a display font only for titles.
  - Keep semantic colour confined to 20px badges with a pale fill and dark text of the same hue.

### Gaps
- I found no official Cal.com design write-up or Figma file in this session. The design team's stated rationale is therefore not cited, and the "crafted" reading above is my interpretation of the code.

## Is dark mode a soft near-black or pure black?

### Takeaway
It is a soft, neutral near-black. The page is #0F0F0F (hsl 0,0%,6%), the sidebar and muted surfaces are #171717, hover is #262626 and active is #404040. Pure black (#000) is used only as text on the white primary button.

### Cited Findings
- Dark `--cal-bg: hsla(0,0%,6%,1)` (#0F0F0F), `--cal-bg-muted` 9% (#171717), `--cal-bg-subtle` 15% (#262626), `--cal-bg-emphasis` 25% (#404040), `--cal-border-subtle` 15% (#262626), `--cal-border` 30% (#4C4C4C), `--cal-text-emphasis` 98% (#FAFAFA), `--cal-text` 83% (#D4D4D4), `--cal-brand-text` 0% (#000000). — [tokens.css](https://github.com/calcom/cal.com/blob/main/packages/config/theme/tokens.css)
- The v5.5.0 comments map these to Tailwind stone names ("stone-950", "stone-900"…), although the values are 0% saturation, which matches Tailwind's neutral scale. — [v5.5.0 globals.css](https://raw.githubusercontent.com/calcom/cal.com/v5.5.0/apps/web/styles/globals.css)
- In v4.0.0 the dark page background was lighter, hsl(0,0%,10%) ≈ #1A1A1A. — [v4.0.0 globals.css](https://raw.githubusercontent.com/calcom/cal.com/v4.0.0/apps/web/styles/globals.css)
- The coss-ui dark background is neutral-950 mixed 96% with white, which is also a soft near-black. — [coss-ui globals.css](https://github.com/calcom/cal.com/blob/main/packages/coss-ui/src/styles/globals.css)

### Inferences
- In dark mode, the sidebar (#171717) sits slightly lighter than the page (#0F0F0F), the reverse of light mode's off-white sidebar against a white page. In both modes the sidebar is one step away from the page.

### Gaps
- I did not compute the exact hex of the coss-ui dark background, because the colour-mix depends on Tailwind v4's oklch neutral-950. It is roughly #0D0D0D–#121212 (**inferred**).
