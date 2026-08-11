import type { Config } from "tailwindcss";

// Design tokens for an internal ops portal: a wholesale/distribution company's
// working tool, not a marketing site. The palette and type pairing are
// deliberately un-templated — see README "Design notes" for the rationale.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17212B",
        paper: "#F5F6F8",
        surface: "#FFFFFF",
        line: "#DFE3E8",
        indigo: {
          DEFAULT: "#2C3E66",
          dark: "#1F2C49",
          light: "#3E5488",
        },
        amber: {
          DEFAULT: "#B8791F",
          bg: "#FBF1DF",
        },
        teal: {
          DEFAULT: "#1D7A6C",
          bg: "#E2F3EF",
        },
        rose: {
          DEFAULT: "#B23A48",
          bg: "#FAE6E8",
        },
        slate: {
          DEFAULT: "#5B6472",
          bg: "#EEF0F3",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 33, 43, 0.06), 0 1px 1px rgba(23, 33, 43, 0.04)",
      },
    },
  },
  plugins: [],
} satisfies Config;
