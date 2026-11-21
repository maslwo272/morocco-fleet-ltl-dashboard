import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#060911",
          900: "#0B1120",
          800: "#111827",
          700: "#1E293B",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "'Droid Arabic Naskh'",
          "var(--font-arabic)",
          "system-ui",
          "sans-serif",
        ],
        arabic: [
          "'Droid Arabic Naskh'",
          "var(--font-arabic)",
          "var(--font-sans)",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "'Droid Arabic Naskh'",
          "var(--font-arabic)",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
