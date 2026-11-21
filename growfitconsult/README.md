# GrowFitConsult

Marketing site for **GrowFitConsult**, the independent consulting firm of Fernando Uhart: 30 years in banking, most of it at Scotiabank (SVP), post-acquisition integrations, operations and bank modernization across 8+ countries.

- Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- English and Latin American Spanish, with a toggle saved in the browser
- Contact form delivered by email through [Resend](https://resend.com)
- Built for Vercel

Single page with anchor navigation: hero, proof stats, services, experience timeline with a route map, how an engagement works, about, testimonials (hidden until real quotes exist), contact.

---

## 1. Run it locally

Requires Node.js 18.17 or newer (20 LTS recommended).

```bash
cd growfitconsult
npm install
cp .env.example .env.local   # then fill in the values, see section 3
npm run dev                  # http://localhost:3000
```

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build (also type-checks and lints) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | TypeScript only |

---

## 2. Fill in the TODOs

Nothing on the site is invented. Where real information is missing, the page shows a visible `TODO:` so it cannot ship unnoticed. Every placeholder:

| # | TODO | Where | How to fill it |
| --- | --- | --- | --- |
| 1 | **Contact email** | `src/lib/site.ts` → `email` | The public address shown in the Contact section. Also added to the structured data automatically. |
| 2 | **Phone** (optional) | `src/lib/site.ts` → `phone` | Set the number to show it, or set `phone: null` to remove the line entirely. |
| 3 | **Headshot photo** | `src/lib/site.ts` → `headshot` | Put a portrait (4:5, at least 900×1125) in `public/`, e.g. `public/fernando-uhart.jpg`, and set `headshot: "/fernando-uhart.jpg"`. It is served through `next/image`. |
| 4 | **Logo file** | `src/components/Wordmark.tsx` (and `logo` in `src/lib/site.ts`) | The header and footer use a typeset "GrowFitConsult" wordmark. When a logo exists, add it to `public/` and render it in `Wordmark.tsx`. Replace `src/app/icon.svg` with the real favicon too. |
| 5 | **Calendly / booking link** | `src/lib/site.ts` → `bookingUrl` | Until set, every "Book a call" button scrolls to the contact form. Once set, they open the scheduler in a new tab. |
| 6 | **Domain** | `NEXT_PUBLIC_SITE_URL` env var | Used for canonical URLs, the sitemap, robots.txt, Open Graph and JSON-LD. On Vercel it falls back to the production `*.vercel.app` URL automatically; set it once the real domain is connected. |
| 7 | **Testimonials** | `src/components/Testimonials.tsx` and `showTestimonials` in `src/lib/site.ts` | Add real, approved quotes (quote, name, role and company), then set `showTestimonials: true`. The section and its nav link appear together. |
| 8 | **Employer per role** (to confirm) | `src/lib/i18n/dictionary.ts` → `experience.roles` | The brief says "most of it at Scotiabank" but does not name the employer for each role from 1995 to 2021, so those entries show the title only. Santander USA and Nave Bank are shown because the brief names them. Add `org: "Scotiabank"` to each role once confirmed. |

The Resend keys are not TODOs in the code; they are environment variables (next section).

---

## 3. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes, for the form | API key from resend.com → API Keys |
| `CONTACT_TO_EMAIL` | Yes, for the form | Inbox that receives enquiries (Fernando's email) |
| `CONTACT_FROM_EMAIL` | Recommended | Sender address, e.g. `GrowFitConsult <hello@yourdomain.com>`. Must be on a domain verified in Resend. If empty, Resend's shared test sender is used, which only delivers to the email address of your own Resend account. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public URL without a trailing slash, e.g. `https://growfitconsult.com` |

Without `RESEND_API_KEY` and `CONTACT_TO_EMAIL` the site still works; the form tells visitors it is not connected yet and points them to LinkedIn.

**Setting up Resend:**
1. Create an account at resend.com and add your domain under **Domains**. Add the DNS records it shows, at your domain registrar or in Vercel DNS.
2. Create an API key with "Sending access".
3. Set the variables above locally in `.env.local` and in Vercel (next section).

Every enquiry arrives as an email with the visitor's name, company, email, chosen service and site language. **Reply-To** is set to the visitor's address, so Fernando can answer directly.

---

## 4. Deploy to Vercel

1. Push this repository to GitHub (it already is, if you are reading this there).
2. In Vercel, choose **Add New → Project** and import the repository.
3. Set **Root Directory** to `growfitconsult`. The repository holds other projects too, so this matters.
4. Framework preset: **Next.js** (detected automatically). Leave the build command and output settings as they are.
5. Under **Environment Variables**, add `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` and `NEXT_PUBLIC_SITE_URL`.
6. Click **Deploy**.
7. Connect the domain: **Project → Settings → Domains → Add**, then follow the DNS instructions. Update `NEXT_PUBLIC_SITE_URL` to match and redeploy.

After deploying, check:
- [ ] `/robots.txt` and `/sitemap.xml` show the real domain
- [ ] Sharing the URL (LinkedIn Post Inspector, or opengraph.xyz) shows the Open Graph image
- [ ] A test message from the contact form arrives in `CONTACT_TO_EMAIL`, and Reply goes to the sender
- [ ] The EN / ES toggle works and is remembered after a reload

---

## How it is built

**Design rules** live in `src/app/globals.css` (tokens and components) and `tailwind.config.ts`.
- **Palette:** dark background `#080810` and one accent, `--accent: #00E5A0`. To re-theme, change `--accent`, plus `--accent-ink` (the text colour drawn on top of the accent).
- **Fonts:** Syne 800 for headlines, DM Mono for numbers, Inter for body text, all through `next/font` (self-hosted, no layout shift).
- **Corners:** 0px for inputs, 8px for buttons, 12px for cards.
- **Depth:** borders only. There are no box shadows anywhere.
- **Headline sizing:** Syne is a very wide face, so headline and card-title sizes scale with the space available (viewport units and container queries). The longest Spanish words still fit on a 320px phone.

**Copy** for both languages is in `src/lib/i18n/dictionary.ts`, typed so that a missing translation is a build error.
- **Default language:** the server renders English. On first visit, the browser switches to Spanish if its language is Spanish, unless the visitor has already chosen with the toggle (saved in `localStorage` under `gfc-locale`).
- **Page metadata** (title and description for search and sharing) is in English.

**Motion:**
- **Hero:** the entrance is CSS, so it starts at first paint and doesn't hold up the page's largest content.
- **Scroll reveals:** use Framer Motion's `LazyMotion` (small bundle).
- **Reduced motion:** with `prefers-reduced-motion`, movement is removed and only gentle fades remain. The stat counters show their final numbers immediately.

**Contact API** (`src/app/api/contact/route.ts`):
- **Validation:** checked server-side with the same rules as the form.
- **Spam:** a honeypot field catches bots.
- **Rate limit:** 5 messages per visitor per 10 minutes. It's kept in memory, so it is best-effort on serverless.
- **Email safety:** the email body is HTML-escaped.
- **Sending:** calls Resend's REST API directly, so there is no SDK dependency.

**SEO:**
- **Metadata:** set in `src/app/layout.tsx`.
- **Generated routes:** `sitemap.xml`, `robots.txt` and the Open Graph image (`src/app/opengraph-image.tsx`, rendered with `next/og` using Syne).
- **Structured data:** JSON-LD for `ProfessionalService` and `Person`, with facts from the brief only.

**Measured on a local production build (Lighthouse 12):**

| | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Mobile | 98–99 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Real-world scores on Vercel depend on the network and CDN and may vary slightly.
