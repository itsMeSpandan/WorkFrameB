import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ─── Surface ──────────────────────────────────────────────────────
        surface: {
          base: "#09090b",    // Zinc-950 — true matte dark, no blue tint
          raised: "#18181b",  // Zinc-900 — cards, panels
          overlay: "#27272a", // Zinc-800 — hover states, subtle emphasis
          border: "#3f3f46",  // Zinc-700 — crisp 1px dividers
        },
        // ─── Text ────────────────────────────────────────────────────────
        foreground: {
          primary: "#fafafa",   // Zinc-50 — stark white headings
          secondary: "#a1a1aa", // Zinc-400 — muted data, labels
          muted: "#71717a",     // Zinc-500 — timestamps, placeholders
        },
        // ─── Accent — single tactical highlight ──────────────────────────
        accent: {
          DEFAULT: "#eab308",    // Amber-500 — raw neon yellow
          hover: "#facc15",      // Amber-400
          muted: "#854d0e",      // Amber-900 — accent background tint
        },
        // ─── Semantic ────────────────────────────────────────────────────
        success: { DEFAULT: "#22c55e", muted: "#14532d" },  // Green
        danger:  { DEFAULT: "#ef4444", muted: "#7f1d1d" },  // Red
        warning: { DEFAULT: "#f59e0b", muted: "#78350f" },  // Amber
        info:    { DEFAULT: "#3b82f6", muted: "#1e3a5f" },  // Blue
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body:    ["var(--font-inter)", "system-ui", "sans-serif"],
        mono:    ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0",
        sm:   "0.125rem",  // 2px — surgical sharpness
        DEFAULT: "0.25rem",
        md:   "0.375rem",
      },
      letterSpacing: {
        tactical: "0.08em",  // Widened for labels, badges
        tight:    "-0.01em",
      },
    },
  },
  plugins: [],
};
export default config;
