# Human-crafted vs "AI-generated" SaaS dashboard design: tells, tokens, and patterns

Context: the target is a dark B2B finance dashboard: #080810 background, mint #00E5A0 primary buttons, Syne 800 headlines, DM Mono numbers.

Method note: tokens marked "[CSS, fetched 2026-10-24]" were pulled with curl straight from the production stylesheets of each company's own website (linked by the homepage HTML) or from the published npm package. They are primary evidence, but they come from **marketing sites**, not the logged-in app, unless noted. Values may differ inside the product.

## 1. What are the widely discussed "AI slop" / "vibe-coded" UI tells (2024–2026)?

### Takeaway
The best-documented tells are Inter/Roboto, indigo/purple accents and purple-to-blue gradients, glows and coloured shadows, soft heavy rounding with the same drop shadow on every card, frosted glass, emoji icons, centered heroes with pill badges, three identical icon cards, and coloured left borders on cards. One 2026 writer also names the trap this dashboard is in: "near-black with a single acid-green … accent" is the cluster models fall back to when told to avoid purple. Purple or green alone is not the tell. The tell is the *default, saturated, unconsidered* version of a colour.

### Cited Findings
- Anthropic's own guidance (Nov 12, 2025): without direction an LLM landing page "will almost always conform to Inter fonts, purple gradients on white backgrounds, and minimal animations". It calls this the "AI slop" aesthetic. Things to avoid: "Overused font families (Inter, Roboto, Arial, system fonts)", "Clichéd color schemes (particularly purple gradients on white backgrounds)", "Predictable layouts and component patterns", "Cookie-cutter design that lacks context-specific character". — [Claude blog: Improving frontend design through Skills](https://claude.com/blog/improving-frontend-design-through-skills)
- The same Anthropic post notes that models "still tend[s] to converge on common choices (Space Grotesk, for example) across generations". So a quirky geometric grotesk used as the "distinctive" font has itself become a convergence default. The post calls the mechanism "distributional convergence": sampling from the high-probability centre of the training data. — [Claude blog](https://claude.com/blog/improving-frontend-design-through-skills)
- Origin of the indigo default: in August 2025 Adam Wathan (creator of Tailwind) apologised on X, in a post with over 1M views, for making every Tailwind UI button `bg-indigo-500` five years earlier. The argument is that LLMs learned "indigo = modern" from that code. Listed hallmarks: Inter/Roboto, purple/indigo accents, "Purple gradients on white backgrounds", centered hero + CTA, "Three-column grids with icons", rounded corners on everything, "Subtle shadows (exactly 0.1 opacity)". It also notes what's usually missing: real hierarchy beyond size, validation and error states. — [prg.sh, Oct 26 2025](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)
- John Davenport (Jul 26, 2026) lists: purple-to-blue hero gradients plus glows and coloured box shadows; a glow behind a card; Inter; a centered hero with a pill badge; three identical cards; the stock section order; "soft everything" (heavy rounding, the same drop shadow on every card, frosted glass panels); emoji as icons; all-caps section labels. Class names that give it away: `indigo-600`, `slate-900`, `rounded-2xl`, `rounded-3xl`, `shadow-lg`, `p-6`. Note that shadcn/ui's default primary is near-black on white, not purple. **Replacement clusters that are also defaults:** "cream, serif, and terracotta", "near-black with a single acid-green or vermilion accent", and broadsheet layouts with hairline rules and zero radius. Copy tells: "Empower", "Unlock", "Transform", "Seamless Integration". — [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)
- "Robots on Payroll" (Jul 21, 2026) lists: indigo default buttons, purple-to-blue gradients, Inter, soft grey shadows on floating cards, emoji feature icons, coloured left borders on cards (a designer quoted calls them "almost as reliable a sign of AI-generated design as em-dashes for text"), and vague spacing. Fixes: a design.md with named hex values, a named type scale, an 8-pt grid, and don't-rules. It also proposes a "reverse squint test": show a screenshot to a fresh chat and ask which AI builder made it. — [Robots on Payroll](https://robotsonpayroll.substack.com/p/how-to-avoid-that-vibe-coded-look)
- An informal audit of Show HN launches reportedly found more than half shared Inter, a lavender accent, glassmorphism and numbered 1-2-3 steps. This is anecdotal and I couldn't reach the primary source. — via search snippet aggregating [superdesign.dev](https://www.superdesign.dev/blog/why-ai-design-looks-generic)

### Inferences
- The current dashboard hits several tells at once. #080810 is near-black with a blue/indigo tint. #00E5A0 is a fully saturated "acid" mint (about HSL 162°, 100%, 45%). Together they match Davenport's "near-black + single acid-green accent" cluster almost exactly. Syne 800 is a quirky display face of the same kind as Space Grotesk, which Anthropic names as a convergence default.
- DM Mono for numbers isn't a documented tell. Still, mono-for-all-numbers in a finance UI reads as a "terminal/crypto" aesthetic. The human products below use the UI sans with tabular figures instead (see §4).

### Gaps
- I found no source that names **Syne** specifically as an AI tell. The evidence is by analogy, through Anthropic's Space Grotesk remark. Searches for Syne/Space Grotesk returned only font catalogues.
- I found no primary article that names "neon green on black" as a tell other than Davenport's "acid-green" line. Glassmorphism and emoji icons are well attested. "Glowing accents" are attested as glows and coloured shadows.

## 2. Palette, type and primary button colour of respected human-made products

### Takeaway
Human-made products use neutral, very slightly tinted greys built as 10–12 step scales with named roles. They keep one brand hue, usually desaturated or mid-lightness rather than neon. Their dark backgrounds are #08090a to #0d1117, not pure black and not strongly tinted. Several "respected" products are themselves indigo (Linear, Mercury) or green (GitHub), which shows that hue is not the problem. Saturation, glow and the lack of a system are.

### Cited Findings

**Vercel / Geist** [CSS, fetched 2026-10-24, from vercel.com/geist/colors stylesheet chunks]
- Background-100 is hsl(0,0%,4%) (≈#0a0a0a) in dark and hsl(0,0%,100%) in light. Background-200 is hsl(0,0%,0%) in dark and 98% in light. — [Vercel Geist Colors](https://vercel.com/geist/colors)
- The gray scale is pure neutral, hue 0 and saturation 0%. In dark it runs from gray-100 = 10% to gray-1000 = 93% (≈#ededed). In light, gray-1000 = 9% (≈#171717). — [Vercel Geist Colors](https://vercel.com/geist/colors)
- Role rules: steps 100/200/300 are background default/hover/active. 400/500/600 are borders default/hover/active. 700/800 are high-contrast backgrounds. 900 is secondary text and 1000 is primary text. Background 2 is for subtle differentiation "used sparingly". Use solid gray for borders, and gray-alpha only where the background should show through. — [Vercel Geist Colors](https://vercel.com/geist/colors)
- Semantic colours, all mid-saturation: green-700 hsl(131,41%,46%), green-800 hsl(132,43%,39%); blue-700 hsl(212,100%,48%); red-700 hsl(358,75%,59%); amber-700 hsl(39,100%,57%). — [Vercel Geist Colors](https://vercel.com/geist/colors) (CSS)
- `--geist-radius: 6px`. Fonts: Geist Sans (most-used font-family), Geist Mono and Geist Serif. `font-feature-settings:"tnum"` is used. — [Vercel Geist](https://vercel.com/geist/colors) (CSS)
- The Geist Button has variants default (the primary), secondary, tertiary, error and warning. The `rounded` shape plus `shadow` is described as mostly for marketing pages. The page doesn't state colours. In practice Vercel's primary is gray-1000 (black on light, white on dark), but that comes from the CSS role mapping, not from a written rule on the page. — [Vercel Geist Button](https://vercel.com/geist/button)

**Linear** [CSS, fetched 2026-10-24, static.linear.app stylesheets linked from linear.app]
- Dark surfaces: `--color-bg-level-0:#08090a`, `level-1:#0f1011`, `level-2:#141516`, `level-3:#191a1b`; `--color-bg-panel:#0f1011`. Marketing background: `#010102`. — [linear.app](https://linear.app) (CSS)
- Dark text: `--color-text-primary:#f7f8f8`, `secondary:#d0d6e0` / `#b4bcd0`, `tertiary:#8a8f98`, `quaternary:#62666d`. Borders: `#23252a`, `#34343a`, `#3e3e44`, or translucent `#ffffff14` / `#ffffff1f`. — [linear.app](https://linear.app) (CSS)
- Brand and accent: `--color-brand-bg:#5e6ad2` (dark variant `#7070ff`), `--color-accent:#7170ff`, `--color-accent-tint:#18182f`. Linear is indigo, but the hue is mid-saturation and is used for brand chips and the accent, not as a glow. — [linear.app](https://linear.app) (CSS)
- Status: `--color-green:#27a644`, `--color-red:#eb5757`, `--color-orange:#fc7840`, `--color-yellow:#f0bf00`, `--color-blue:#4ea7fc`. — [linear.app](https://linear.app) (CSS)
- Fonts: `--font-regular:"Inter Variable", "SF Pro Display", …`; `--font-monospace:"Berkeley Mono", ui-monospace, "SF Mono"…`. Non-standard weights: normal 400, **medium 510, semibold 590, bold 680**, light 300. — [linear.app](https://linear.app) (CSS)
- Type scale (rem / letter-spacing): text-mini .8125 / -.01em; text-small .875 / -.013em; text-regular .9375 / -.011em; text-large 1.0625 / 0. Titles: title-1 1.0625rem, title-2 1.25rem, title-3 1.5rem (all -.012em); title-4 2rem / -.022em / lh 1.125; title-5 2.5rem; title-6 3rem (-.022em). — [linear.app](https://linear.app) (CSS)
- Radii: 4, 6, 8, 12, 16, 24, 32px, plus pill. — [linear.app](https://linear.app) (CSS)
- Redesign write-up (Mar 28, 2024, Karri Saarinen et al.): theme generation moved from HSL to **LCH**. Each theme is now defined by three variables (base, accent, contrast) instead of 98. Blue in the chrome was limited "for a more neutral, timeless look". Headings use **Inter Display** and body uses Inter. The aims were less visual noise and higher density in navigation, plus alignment of sidebar and tab labels, icons and buttons. — [Linear: How we redesigned the Linear UI (part II)](https://linear.app/now/how-we-redesigned-the-linear-ui)

**GitHub / Primer** [@primer/primitives 10.4.0 via unpkg]
- Dark: `--bgColor-default:#0d1117`, `--bgColor-muted:#151b23`, `--fgColor-default:#f0f6fc`, `--fgColor-muted:#9198a1`, `--borderColor-default:#3d444d`, `--fgColor-accent:#4493f8`. — [unpkg @primer/primitives dark.css](https://unpkg.com/@primer/primitives@10.4.0/dist/css/functional/themes/dark.css)
- **Primary button is green, but muted:** `--button-primary-bgColor-rest: var(--bgColor-success-emphasis)` = **#238636** in dark, with white text. In light, `--button-primary-bgColor-rest:#1f883d`. — [unpkg dark.css](https://unpkg.com/@primer/primitives@10.4.0/dist/css/functional/themes/dark.css); [Primer color primitives](https://primer.style/foundations/primitives/color)
- Status (dark): success `#3fb950`, danger `#f85149`, attention `#d29922`. Light: success fg `#1a7f37`, danger fg `#d1242f`, attention fg `#9a6700`; light bg `#ffffff`, fg `#1f2328`, border `#d1d9e0`. — [Primer color](https://primer.style/foundations/primitives/color)
- Font: system stack `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial…`, with display using the same stack. Mono: `ui-monospace, SFMono-Regular, SF Mono, Menlo…`. Title sizes: large 2rem, medium 1.25rem, all **semibold**. Display weight is medium. Line heights sit on a 4px grid, and arbitrary weights like 700 are discouraged in favour of weight tokens. — [unpkg typography.css](https://unpkg.com/@primer/primitives@10.4.0/dist/css/functional/typography/typography.css); [Primer typography](https://primer.style/product/getting-started/foundations/typography)

**Mercury** (B2B finance, the closest analogue) [CSS, fetched 2026-10-24, mercury.com stylesheets]
- Fonts: custom **Arcadia** and **Arcadia Display** (most-used), **Tiempos** / Tiempos Headline / Tiempos Fine (serif), and IBM Plex Mono (rare: 5 to 7 uses vs about 60 for Arcadia). Weights include unusual 320 / 360 values. `tabular-nums` is used. — [mercury.com](https://mercury.com) (CSS)
- Neutrals are slightly indigo-tinted: `--color-neutral-base-1000:#10101a`, 950 `#171721`, 900 `#1e1e2a`, 800 `#272735`, 600 `#535461`, 500 `#70707d`, 300 `#c3c3cc`, 100 `#f4f5f9`. There is also a warm beige scale (`#f6f5f2` … `#201f1c`). — [mercury.com](https://mercury.com) (CSS)
- **Mercury's greens are muted:** `--color-green-magic-600:#188554`, 700 `#036e43`, 400 `#77c599`; base greens `#5b7a67`, `#405d4c`, `#1a211d`. Accent `--color-purple-magic-600:#5266eb` (periwinkle indigo); teal `--color-blue-magic-600:#007f95`. — [mercury.com](https://mercury.com) (CSS)
- Third-party teardowns describe an indigo CTA around #5266eb, which matches the CSS above, and pill-radius buttons. They disagree on dark-first vs light-first. — [blakecrosley.com Mercury guide](https://blakecrosley.com/guides/design/mercury); [byq.supply](https://app.byq.supply/styles/brand/mercury)

**Attio** [CSS, fetched 2026-10-24, attio.com stylesheets]
- Fonts: **Inter + Inter Display**, Tiempos Text (serif) and JetBrains Mono. — [attio.com](https://attio.com) (CSS)
- Neutrals are slightly cool, defined in LAB: black-100 `#1c1d1f`, black-200 `#202124`, black-500 `#383e47`, black-700 `#6f7988`, black-900 `#a4adba`; white-200 `#fafafb`. Blue-500 is `#266df0`. Button tokens are mostly ghost and outline variants with black/white/blue fills. — [attio.com](https://attio.com) (CSS)

**Plain** [plain.com HTML, Framer site]
- Font-family declarations include Inter (Framer default), **Geist Mono**, Fragment Mono, Lato and Inria Serif. — [plain.com](https://plain.com)

**Stripe Dashboard**
- Stripe Apps expose only semantic tokens (backgroundColor `container`, keyline `neutral`, color `success`/`primary`). You "can't choose arbitrary font faces", and fonts are set via named `font` tokens such as `heading`. Spacing tokens: 0 / 2 / 4 / 8 / 16 / 24 / 32 / 48px (xxsmall to xxlarge). Hex values aren't published on the page. — [Stripe Apps: Style your app](https://docs.stripe.com/stripe-apps/style)
- Third-party only (unverified): the brand moved from blurple #635BFF to a deeper #533AFD. The marketing font is Söhne. Button radius is about 4px, cards 6–8px. The dashboard reportedly uses a different palette from marketing. — [kombai Stripe](https://kombai.com/examples/design-systems/stripe-kombai); [opendesigner.io](https://opendesigner.io/fr/blog/recreating-stripe-linear-vercel-design-systems-with-design-md)

### Inferences
- The "premium dark" backgrounds cluster at #08090a (Linear), #0a0a0a (Vercel) and #0d1117 (GitHub). They are neutral or barely cool. #080810 is in the same lightness range but has a visible blue cast. Mercury's #10101a shows a cast can work if the whole neutral ramp is tinted consistently.
- Accent saturation in human systems: GitHub's green #238636 is about HSL 128°, 59%, 33%. Mercury's #188554 is about 153°, 70%, 31%. Vercel's green-700 is 131°, 41%, 46%. #00E5A0 is 100% saturated at 45% lightness, roughly 2–3x the chroma of any of them. A mint in Mercury's #188554 to #77c599 range keeps the brand hue without the neon.
- Every product with a custom feel spends its distinctiveness on **type** (Mercury's Arcadia plus Tiempos, Linear's tuned Inter weights 510/590, Vercel's own Geist) rather than on colour.

### Gaps
- **Notion, Basecamp/HEY, Height**: not researched within the tool budget. No tokens are recorded. (Height reportedly shut down in 2025; unverified.)
- Stripe Dashboard hex tokens are not published. Sail isn't public.
- Attio's and Linear's in-app primary button fills aren't confirmed. These tokens come from marketing-site CSS.

## 3. What do they do for primary buttons instead of saturated green/purple?

### Takeaway
There are three patterns. (a) Monochrome: an inverted black/white primary (Vercel; shadcn's default is near-black, per Davenport). (b) One mid-saturation brand hue with white text: Linear #5e6ad2, Mercury #5266eb, GitHub's muted green #238636. (c) Most actions are secondary, ghost or outline buttons (Attio's token set is dominated by ghost and outline). None of them use a neon fill with dark text, and none use a glow.

### Cited Findings
- Geist: the default Button is the primary action, and the rounded+shadow combination is mainly a marketing-page style. Gray-1000 is the primary text and fill role (≈#ededed in dark, #171717 in light). — [Geist Button](https://vercel.com/geist/button); [Geist Colors](https://vercel.com/geist/colors)
- GitHub primary is `#238636` dark / `#1f883d` light with white text. — [Primer dark.css](https://unpkg.com/@primer/primitives@10.4.0/dist/css/functional/themes/dark.css)
- Linear brand bg is `#5e6ad2`. — [linear.app CSS](https://linear.app)
- Mercury's accent is `#5266eb`. — [mercury.com CSS](https://mercury.com)
- shadcn/ui's default primary is near-black on white. AI output adds the purple when nothing fills that blank. — [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same)

### Inferences
- For the target dashboard: make primary a light neutral fill (#ededed or #f7f8f8) with dark text, or a darkened mint (about #188554 to #1f8a5f) with white text. Reserve the bright mint for at most a 1–2px focus ring or the positive-delta text colour, if anywhere.

### Gaps
- I didn't capture hover or active states for the button colours.

## 4. Typography: typefaces, numerals, headings. Is a quirky display font a tell?

### Takeaway
Human SaaS products use a neutral grotesk or system sans (Inter / Inter Display, Geist, the system stack, custom Arcadia), sometimes with an editorial serif (Tiempos at Mercury and Attio). Numbers use **tabular lining figures in the UI sans**, and mono is kept for code and IDs. Headings are semibold (590–600) or even medium, not 800, with slight negative tracking (-0.012em at small sizes, -0.022em at 2rem+). A quirky display face at weight 800 is not used by any of these products, and Anthropic flags Space Grotesk-style choices as convergence defaults.

### Cited Findings
- Linear: Inter Variable; Inter Display for headings; weights 510/590/680; tracking -.011em to -.022em; `font-variant-numeric: lining-nums tabular-nums` (11 uses) plus `slashed-zero` variants; Berkeley Mono only for monospace. — [linear.app CSS](https://linear.app); [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- Vercel: Geist Sans primary, Geist Mono secondary; `font-feature-settings:"tnum"`. — [Geist CSS](https://vercel.com/geist/colors)
- GitHub: system font stack; titles semibold; display medium; avoid arbitrary weights like 700. — [Primer typography tokens](https://unpkg.com/@primer/primitives@10.4.0/dist/css/functional/typography/typography.css); [Primer typography](https://primer.style/product/getting-started/foundations/typography)
- Mercury: Arcadia / Arcadia Display, Tiempos serif, rare IBM Plex Mono, light weights 320/360/400, tabular-nums. — [mercury.com CSS](https://mercury.com)
- Attio: Inter + Inter Display + Tiempos Text, JetBrains Mono. — [attio.com CSS](https://attio.com)
- Anthropic warns against Inter and system fonts for *landing pages*, yet notes Space Grotesk as a convergence pick. The two risks run in opposite directions: generic Inter, and the "distinctive" font everyone picks. — [Claude blog](https://claude.com/blog/improving-frontend-design-through-skills)

### Inferences
- Swap Syne 800 for a neutral grotesk at 590–600 with -0.02em tracking (Inter Display, Geist, or a licensed custom face). For finance character, consider adding an editorial serif for page titles or large balances, as Mercury does with Tiempos. Set numbers in the sans with `font-variant-numeric: tabular-nums lining-nums` (optionally `slashed-zero`), not DM Mono everywhere.
- Note the tension: Inter is itself a named AI tell for marketing pages, but Linear and Attio use it in-product with tuned weights and tracking. The tuning (non-default weights, Display optical size, tracking) is what separates the two uses.

### Gaps
- I didn't fetch the precise heading sizes used inside dashboards (as opposed to marketing pages).

## 5. Density, borders vs shadows, radii, and semantic status colour

### Takeaway
Human systems separate surfaces with stepped near-black surfaces (Linear levels 0–3 differ by about 2–3% lightness each) and 1px low-contrast borders (solid or about 8–12% white alpha), not drop shadows or glows. Their radii are small (Geist 6px; Linear 4–8px for UI, larger only for marketing). Spacing sits on a 4/8px scale. Status colours are fixed semantic tokens, applied to text, icons and small badges.

### Cited Findings
- Linear borders: `#23252a` / `#34343a` / `#3e3e44` or `#ffffff14` / `#ffffff1f`. Surfaces: #08090a → #0f1011 → #141516 → #191a1b. The redesign was aimed at density and reduced noise. — [linear.app CSS](https://linear.app); [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- Geist: borders use gray 400/500/600 for default/hover/active. Use alpha greys only for shadows and overlays. Radius 6px. Small badges use colour step 2–3 as their background. — [Geist Colors](https://vercel.com/geist/colors)
- Stripe spacing: 2/4/8/16/24/32/48px. Borders are expressed as `keyline: 'neutral'`. — [Stripe Apps style](https://docs.stripe.com/stripe-apps/style)
- Primer line heights align to a 4px grid. — [Primer typography](https://primer.style/product/getting-started/foundations/typography)
- AI tells in this area: "rounded-2xl/3xl", "shadow-lg" on every card, frosted glass, glow behind cards, coloured left borders on cards, and vague "generous padding". — [CodeMySpec](https://codemyspec.com/blog/vibe-coded-websites-look-the-same); [Robots on Payroll](https://robotsonpayroll.substack.com/p/how-to-avoid-that-vibe-coded-look)
- Status token sets: Linear green #27a644 / red #eb5757 / yellow #f0bf00. GitHub dark success #3fb950 / danger #f85149 / attention #d29922. Vercel green-700 hsl(131,41%,46%) / red-700 hsl(358,75%,59%) / amber-700 hsl(39,100%,57%). — sources as above

### Inferences
- For the dashboard: 1px borders around #ffffff14, a 2–3-step surface ramp, a 6–8px radius, no card shadows on dark, and no coloured left-border cards. Use status colour only on the delta text or icon and on small tinted badges. Keep it out of large fills, and don't let the brand mint double as "success". Today the mint is both brand and positive, which makes every button look like a gain.

### Gaps
- No quantitative row-height or density figures (e.g. table row px) came from primary sources.
