import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-barlow-condensed)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        fitvant: {
          bg: "#0A0E07",
          surface: "#12180D",
          card: "#141C0F",
          border: "#232F19",
          volt: "#C8F135",
          voltHover: "#D6F858",
          muted: "#9BA394",
        },
        fitness: {
          primary: "#C8F135", // FITVANT Volt Lime
          primaryHover: "#D6F858",
          dark: "#0B0F07", // FITVANT Obsidian Olive
          darkHover: "#141C0F",
          light: "#182211",
          bg: "#0A0E07",
          card: "#141C0F",
          accent: "#FBBF24",
          danger: "#EF4444",
          blue: "#38BDF8",
        },
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
export default config;
