import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080810",
        surface: "#0D0D17",
        raised: "#12121E",
        line: "#1E1E2C",
        "line-strong": "#2A2A3B",
        fg: "#ECECF1",
        muted: "#9A9AAA",
        // Lowest text tier; still >= 4.5:1 on ink and surface.
        faint: "#7C7C94",
        mint: { DEFAULT: "#00E5A0", dim: "#00B37D", ink: "#03251A" },
        danger: "#FF5A5F",
        warn: "#F5B841",
        info: "#7FB8FF",
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { input: "0px", button: "8px", card: "12px" },
      fontSize: {
        "2xs": ["11px", "14px"],
        // Named display steps so pages never reach for one-off sizes.
        stat: ["28px", { lineHeight: "1", letterSpacing: "-0.01em" }],
        display: ["34px", { lineHeight: "1.05" }],
        "display-xl": ["40px", { lineHeight: "1.05" }],
      },
    },
    // Borders over shadows: shadow utilities are removed entirely.
    boxShadow: { none: "none" },
  },
  plugins: [],
};

export default config;
