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
        muted: "#8B8B9C",
        faint: "#5A5A6B",
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
      fontSize: { "2xs": ["11px", "14px"] },
    },
    // Borders over shadows: shadow utilities are removed entirely.
    boxShadow: { none: "none" },
  },
  plugins: [],
};

export default config;
