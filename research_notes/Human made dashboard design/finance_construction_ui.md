# Visual Design of Human-Made Finance, Accounting and Construction-Payments Dashboards

Research scope: Mercury, Ramp, Brex, QuickBooks (Intuit), Xero (XUI), FreshBooks, Wave, Procore (CORE), Siteline, Autodesk Construction Cloud, plus Stripe and Atlassian for comparison. Researched 2026-10-24.

Note on method and source quality: Most of these companies do **not** publish their product design tokens publicly. The only exact token values gathered below come from (a) Procore's public npm package `@procore/core-css` (v10.27.4, published 2022-05-16, downloaded and parsed directly), (b) Xero's official 2023 logo guidelines, and (c) Stripe's own design blog. Many search results for "Ramp/Mercury design system" are **third-party reverse-engineered "DESIGN.md" / style-reference pages** (shadcn.io, refero, webdesignhot, blakecrosley). They are flagged as unofficial wherever they appear and should not be treated as fact.

## Q1: Palettes and primary-button colours (Mercury, Ramp, Brex, QuickBooks, Xero, FreshBooks, Wave, Procore, Siteline, ACC)

### Takeaway
The one verifiable token set (Procore CORE) is close to the "calm credible" ideal: a near-black blue-gray text colour (#232729), a cool gray scale, blue (#2066DF) kept for focus/links/info, and the brand orange (#FF5100) used almost only for the primary button and required-field marks. The brand colour goes on the main call to action and not much else. Intuit tells designers outright not to use QuickBooks green outside the logo.

### Cited Findings
**Procore CORE (legacy CSS package, `@procore/core-css` 10.27.4, npm "latest" tag, published 2022-05-16)**: values pulled straight from `dist/core.css`. Counts are how many times each hex appears in the file. Source: [unpkg core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css), [file listing](https://app.unpkg.com/@procore/core-css@10.27.4/files/dist), [npm registry](https://registry.npmjs.org/@procore/core-css)
- Primary button: background/border `#FF5100` (Procore orange), text `#FFFFFF`, letter-spacing .25px. Hover darkens to `#E64900`. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- The orange appears only 12 times in a 131 kB stylesheet: the primary button, `.core-link--gray:hover`, and `.core-notation--required` (required-field asterisk). The brand colour is used sparingly. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Primary text colour `#232729` (82 uses, the most common colour), a very dark blue-gray rather than pure black. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Gray scale in use: `#464F53`, `#5E696E`, `#6A767C` (secondary text, 38 uses), `#75838A`, `#ACB5B9` (disabled/icons, e.g. table caret), `#D6DADC` (borders, 65 uses), `#E3E6E8` (hover/active fill), `#EEF0F1`, `#F4F5F6` (subtle background), `#F9FAFA`. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Blue `#2066DF` (44 uses) is the focus ring colour (e.g. `.core-button:focus{border:1px solid #2066df}`). Darker blue `#1A52B3` is used for links and the info banner's left border. Light blue tints are `#E4EDFB` / `#EDF3FC`. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Status colours. Error: `#E61A20` on tint `#FEF6F6`. Success: `#1C8217` on tint `#EEFCEE`. Info: `#1A52B3` on `#EDF3FC`. Warning/yellow: `#FFD500` with a pale tint of `#FFFAE0`. Purple accent: `#8A4C9A`. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Banners use a pale tinted background, a coloured 4px-style **left border** and a coloured **icon**, for example `.core-banner--error{background-color:#fef6f6;border-left-color:#e61a20}` plus `.core-banner__icon{color:#e61a20}`. Status is shown by an icon and a border, not by a big block of saturated colour. Success toasts use a solid `#1C8217` fill. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Current CORE React (v12.58.0) docs say the font is **Inter**, which the client has to supply. Design guidelines live on an internal Procore Confluence, and design.procore.com now redirects to brand.procore.com, which returned no readable content. — [core.procore.com intro](https://core.procore.com/12.58.0/web/introduction/), [core.procore.com](https://core.procore.com/)

**QuickBooks / Intuit**
- Intuit's QuickBooks brand colour page says the full palette is reserved for illustrations: "Don't use QuickBooks green—it's only reserved for the logo." (I got this through a search snippet; the page now 301-redirects to design.intuit.com root, so I could not re-verify it in full.) — [design.intuit.com QuickBooks color](https://design.intuit.com/quickbooks/brand/design-foundations/color/)
- A third-party palette site lists `#2CA01C` as Intuit/QuickBooks green. **Unverified**, not an official token. — [designpieces.com](https://www.designpieces.com/palette/intuit-color-palette-hex-and-rgb/)
- Intuit publishes a PMS colour guide PDF. I could not extract its contents. — [Intuit PMS PDF](https://digitalasset.intuit.com/render/content/dam/intuit/sa/en_us/quickbooks/brand-design-guidelines/quickbooks-pms-brand-color-palette-external.pdf)

**Xero**
- Official Xero Blue is `#13B5EA` (RGB 19,181,234; PMS 306; CMYK 74/2/2/0). The only allowed logo alternatives are white or black (2023 logo guidelines). — [Xero Logo Guidelines 2023](https://brandfolder.xero.com/8HSCTPAX/as/q32qb8gfft495s6bf88b3fh/Xero_Logo_Guidelines2023)

**Siteline (construction AR / pay apps)**
- Siteline's marketing describes A/R reporting that shows average invoice aging, billing status, and which GCs pay fastest and slowest. It has a filterable "all pay apps, all clients" view (status, PM, division), and retention is shown at line-item and pay-app level. — [Siteline subcontractor billing](https://www.siteline.com/l/subcontractor-billing-software), [Siteline retention help](https://support.siteline.com/en/articles/11670337-adjust-or-bill-for-retention-on-a-pay-app), [siteline.com](https://siteline.com/)

**Mercury / Ramp (unofficial only)**
- Third-party analyses describe Mercury as using a commissioned "Arcadia" type family (ArcadiaDisplay for headlines, weight ~480, body line-height ~1.625) and a "dark-first" brand palette. **Unofficial, reverse-engineered**, and the shadcn.io page itself says its hex values are approximations. — [blakecrosley.com Mercury guide](https://blakecrosley.com/de/guides/design/mercury), [shadcn.io Mercury](https://www.shadcn.io/design/mercury)
- Third-party Ramp style references disagree about the font (Lausanne with ss01 vs. Aeonik/Inter), so neither is reliable. — [refero Ramp](https://styles.refero.design/style/b38702a0-75ab-474c-9106-00b624535825), [webdesignhot Ramp](https://www.webdesignhot.com/design.md/ramp/)

### Inferences
- Procore's pattern maps directly onto Holdback HQ: one warm brand accent on the primary button only, cool blue-gray neutrals for most of the UI, a separate blue for focus and links, and status colours on pale tints with a left border and icon.
- Intuit's "logo-only" rule for brand green is a strong precedent against using the "money green" accent everywhere in a finance app. Green should mean "paid/success", not "brand".

### Gaps
- No public tokens found for Mercury, Ramp, Brex, FreshBooks, Wave or Autodesk Construction Cloud. They have no public design-system sites, and searches only returned unofficial scrapes.
- Xero's XUI product design system: I found no public documentation (searches returned the unrelated Xojo "XUI"). The XUI button colour is unknown.
- The Procore tokens come from the 2022 legacy CSS package. Newer CORE React (v12) token values may differ, and the current guidelines are behind Procore's internal Confluence.

## Q2: Light vs dark defaults and dark-mode handling

### Takeaway
Finance tools present data on light backgrounds by default and add dark mode as a user choice built on semantic tokens. Mercury's 2022 write-up is the clearest primary source on how they did it.

### Cited Findings
- Mercury (Dec 2022 product update): its iOS colour system originally named colours by hue, so dark mode would have meant inverting the palette, which "produced clashing yellows against dull backgrounds." They rebuilt it as a **token-based semantic system grouped by usage (e.g. "Background/Primary")** so individual colours can be tuned for each theme. — [Mercury blog, Dec 2022](https://mercury.com/blog/december-2022-product-updates)
- Mercury now offers Dark, Light or System default on web (Profile > Appearance) and Light/Dark/Auto on mobile, so dark mode is opt-in. — [Mercury support: Enabling dark mode](https://support.mercury.com/hc/en-us/articles/37538153196948-Enabling-dark-mode)
- The Procore CORE legacy CSS has no dark-theme variables. Every surface is defined on white (e.g. `.core-table__table{background-color:#fff}`). — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Third-party sites call Mercury's *marketing brand* "dark-first". This contrasts with the in-app default, which follows the user's setting (unofficial). — [blakecrosley.com](https://blakecrosley.com/de/guides/design/mercury)

### Inferences
- Default to light, offer dark through semantic tokens (bg/surface/text/border/status), and never just invert. Tune status hues separately in dark mode (Mercury's "clashing yellows" lesson applies directly to amber "due soon" states).

### Gaps
- No primary sources found on dark-mode support for QuickBooks, Xero, Ramp, Brex, Procore (current) or Siteline.

## Q3: How money is shown (tabular numerals, alignment, negatives, compact figures, aging buckets)

### Takeaway
None of the vendors publish a public spec on numeric formatting. The concrete evidence is Procore's dense 14px/20px tables and general advice on tabular figures. Siteline shows aging as summary metrics and filters rather than flashy charts.

### Cited Findings
- Procore table: `font-size:14px; line-height:20px; letter-spacing:.15px`, white background, `border-collapse:collapse`, 4px radius. Group rows use 16px padding and 600-weight titles. Expand carets are muted gray `#ACB5B9`. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- The Procore legacy CSS contains no `font-variant-numeric` / `font-feature-settings` declarations, so tabular figures are not set explicitly there. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- General dashboard guidance: tabular typefaces have even character spacing so columns align. Recommended for reports, charts and dashboards. — [Yellowfin best-practice guide](https://www.yellowfinbi.com/best-practice-guide/dashboard-design-principles-and-best-practice/language-fonts-and-typography)
- Unofficial Ramp-inspired references recommend `tabular-nums` for numeric data (e.g. "Numeric: 17px / 700 tabular-nums"). — [refero Ramp](https://styles.refero.design/style/b38702a0-75ab-474c-9106-00b624535825), [tessl Ramp UI skills](https://tessl.io/registry/skills/github/ihlamury/design-skills/ramp-ui-skills)
- Siteline presents A/R as average invoice aging, billing status, and GC payment speed. Its marketing figures use illustrative bars. — [Siteline](https://www.siteline.com/l/subcontractor-billing-software), [SMACNA product update Aug 2023](https://smacna.org/stay-informed/news-and-publications/products-and-services-update/august-2023/understand-your-a-r-like-never-before)

### Inferences
- Use `font-variant-numeric: tabular-nums` (Inter supports it), right-align currency columns, show full figures with cents in tables, and save compact figures ($1.2M) for KPI tiles. These are standard accounting conventions; I found no vendor spec for them.
- For aging buckets (Current/30/60/90+), a single-hue sequential ramp (light to dark gray-blue, or neutral to one warning hue for 90+) fits the restrained status palette better than a rainbow.

### Gaps
- No primary source found on negative-amount display (parentheses vs minus vs red) for QuickBooks, Xero, FreshBooks or Wave.
- No published aging-chart specs from any vendor. Screenshot galleries (saasframe, mobbin) were not reached within the time budget.

## Q4: Red/amber/green status without relying on hue alone; badge/pill styles

### Takeaway
Trusted systems pair status colour with a second cue: an icon, a left border, a text label, or a tinted fill with dark text. Stripe's colour system engineers badge contrast so every hue carries the same visual weight.

### Cited Findings
- Procore banners: pale tint background, coloured left border, and a coloured status icon (error `#E61A20`/`#FEF6F6`, success `#1C8217`/`#EEFCEE`, info `#1A52B3`/`#EDF3FC`, warning tint `#FFFAE0`). — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Stripe ("Designing accessible color systems", Daryl Koopersmith & Wilson Miner, 2019-10-15): they rebuilt their palette in the perceptually uniform CIELAB space so hues have consistent visual weight. Text and icons meet WCAG 4.5:1 (small text) and 3:1 (large text/icons) on white and on every hue's lightest tint. Rule of thumb: colours **5 levels apart** pass for small text and **4 apart** for icons/large text. For Badges they shifted both background and text up one level to keep contrast even across hues. (Pre-2023, included because it is the canonical primary write-up.) — [Stripe blog](https://stripe.com/blog/accessible-color-systems)
- Stripe also says that "WCAG addresses contrast only, not vibrancy", so both have to be designed for. — [Stripe blog](https://stripe.com/blog/accessible-color-systems)

### Inferences
- Pills for Holdback HQ: tinted background (step ~100) with dark same-hue text (step ~700+), always with a text label ("Overdue", "Due in 5 days", "Holdback released") and ideally a small icon. Never use a coloured dot alone.
- Make overdue severity readable without colour by also encoding it in text weight, an icon shape (clock vs alert), or day counts.

### Gaps
- The Atlassian Lozenge page (atlassian.design/components/lozenge) returned empty content to the fetcher, so I could not cite its subtle/bold guidance.
- No vendor-specific colour-blind testing write-ups found for the finance/construction tools.

## Q5: What makes these interfaces feel trustworthy (design-team write-ups)

### Takeaway
The primary-source evidence points to restraint built on a system. Mercury rebuilt colour as semantic tokens rather than hue names. Stripe engineered consistent visual weight and contrast. Procore and Intuit keep the brand colour off everything except the main action or the logo. Gray neutrals carry most of the UI.

### Cited Findings
- Mercury's move to usage-named semantic tokens ("Background/Primary") made colours tunable and consistent across themes. — [Mercury blog, Dec 2022](https://mercury.com/blog/december-2022-product-updates)
- Stripe's goals were "predictable accessibility, clear and vibrant hues, and consistent visual weight." — [Stripe blog](https://stripe.com/blog/accessible-color-systems)
- Procore: the most common colours are neutral (`#232729`, `#D6DADC`, `#ACB5B9`, `#6A767C`). Brand orange is 12 of hundreds of colour uses. — [core.css](https://unpkg.com/@procore/core-css@10.27.4/dist/core.css)
- Intuit reserves QuickBooks green for the logo only. — [design.intuit.com](https://design.intuit.com/quickbooks/brand/design-foundations/color/)
- Unofficial analysis credits Mercury's premium feel to a bespoke typeface, small deliberate type values (headline weight 480) and art-directed photography. **Not official.** — [blakecrosley.com](https://blakecrosley.com/de/guides/design/mercury)
- QuickBooks Online has gone through public "new look" redesigns, covered by accounting press. — [QuickBooks AU blog](https://quickbooks.intuit.com/au/blog/product-update/coming-soon-quickbooks-online-will-new-look), [Insightful Accountant](https://insightfulaccountant.com/accounting-tech/general-ledger/new-look-for-qbo-due-soon)

### Inferences
- The recipe that is credible and doesn't look AI-generated: off-black blue-gray text, a 9–10 step cool gray ramp, one brand accent used only on the primary button and selected nav, a separate focus blue, status colours used only as tints, borders and icons, Inter (or similar) with tabular figures, 14px/20px tables, 4px radii and very light shadows (Procore uses `0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.2)`). Avoid gradients, glows, purple-blue hero gradients and oversized rounded cards.

### Gaps
- No official Ramp, Brex, FreshBooks, Wave or Autodesk design-team blog posts on visual design were found within the time budget.
- Screenshot galleries (mobbin, saasframe) were not reviewed, so claims about table density in Ramp/Brex/Mercury dashboards are unsourced.
