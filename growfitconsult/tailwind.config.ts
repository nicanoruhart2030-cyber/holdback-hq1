import type { Config } from "tailwindcss";

// Every colour comes from a CSS variable in globals.css, so the palette
// (and the single accent) can be changed in one place.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // hover: styles only apply on devices that can really hover (no sticky hover after a tap)
  future: { hoverOnlyWhenSupported: true },
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0px",
        btn: "8px",
        card: "12px",
      },
      maxWidth: {
        page: "1200px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
