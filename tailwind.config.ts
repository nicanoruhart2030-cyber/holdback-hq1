import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Cal.com-derived light theme: a gray ladder, ink for primary actions,
      // colour only in status badges. See reports/Human made dashboard design.md.
      colors: {
        ink: "#FFFFFF", // page
        surface: "#FFFFFF", // cards sit on the page, separated by borders
        raised: "#F6F7F9", // sidebar, table headers, hover
        subtle: "#EEEFF2",
        emphasis: "#E5E7EB", // active nav, gray badge
        line: "#E5E7EB",
        "line-strong": "#D1D5DB",
        fg: "#070A0D", // headings, amounts
        body: "#3C3E44",
        muted: "#6B7280",
        faint: "#6B7280",
        accent: { DEFAULT: "#292929", hover: "#0F0F0F", fg: "#FFFFFF" },
        danger: { DEFAULT: "#811D1D", bg: "#F9E3E1", border: "#FEC8C8" },
        warn: { DEFAULT: "#74331B", bg: "#FFEDD6" },
        info: { DEFAULT: "#243C84", bg: "#DDE7FD" },
        ok: { DEFAULT: "#285239", bg: "#E4FBED" },
        link: "#2563EB",
        aging: { current: "#D1D5DB", d30: "#FED6A9", d60: "#FB923C", d90: "#C2410C", d90p: "#811D1D" },
      },
      fontFamily: {
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { badge: "4px", input: "6px", card: "8px", button: "10px" },
      fontSize: {
        "2xs": ["11px", "14px"],
        // Named display steps so pages never reach for one-off sizes.
        stat: ["28px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        display: ["20px", { lineHeight: "28px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "display-xl": ["28px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
      },
    },
    // Borders separate surfaces; shadows only on buttons and popovers.
    boxShadow: {
      none: "none",
      button:
        "0 1px 1px rgba(0,0,0,.08), 0 2px 3px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.12), inset 0 -2px 1px rgba(0,0,0,.04)",
      "button-pressed": "inset 0 2px 1px rgba(0,0,0,.10)",
      quiet: "0 1px 2px rgba(0,0,0,.03)",
      popover: "0 5px 20px rgba(0,0,0,.10), 0 10px 40px rgba(0,0,0,.03)",
    },
  },
  plugins: [],
};

export default config;
