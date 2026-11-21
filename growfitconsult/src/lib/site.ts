/**
 * Site-wide settings. Every value that still needs real information is marked
 * with a `TODO:` comment and listed in README.md. Empty strings render as a
 * visible "TODO" on the page so nothing ships silently unfinished.
 */

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  // Set automatically by Vercel for production deployments.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

type SiteConfig = {
  name: string;
  founder: string;
  url: string;
  linkedin: string;
  email: string;
  phone: string | null;
  bookingUrl: string;
  headshot: string;
  logo: string;
  showTestimonials: boolean;
  countries: readonly ["AR", "CA", "PE", "UY", "MX", "CO", "US", "PR"];
};

export const site: SiteConfig = {
  name: "GrowFitConsult",
  founder: "Fernando Uhart",
  url: resolveSiteUrl(), // TODO: domain — set NEXT_PUBLIC_SITE_URL once the domain is live
  linkedin: "https://www.linkedin.com/in/fernando-uhart-08542943/",

  // TODO: contact email — the public address shown on the site
  email: "",
  // TODO: phone (optional) — "" shows a visible TODO; set to null to hide the phone line
  phone: "",
  // TODO: Calendly/booking link — "Book a call" scrolls to the contact form until this is set
  bookingUrl: "",
  // TODO: headshot photo — put the file in /public (e.g. /fernando-uhart.jpg) and set the path
  headshot: "",
  // TODO: logo file — the header uses a typeset wordmark until a logo file exists
  logo: "",

  // Testimonials stay hidden until real, approved quotes exist.
  showTestimonials: false,

  countries: ["AR", "CA", "PE", "UY", "MX", "CO", "US", "PR"],
};

/** Booking target: the external scheduler when set, otherwise the contact form. */
export const bookingHref = site.bookingUrl || "#contact";
export const bookingIsExternal = Boolean(site.bookingUrl);
