import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          50: "#f0f9ff",
          100: "#dff4ff",
          200: "#b9e8ff",
          300: "#7dd6ff",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        aero: {
          glass: "rgba(255,255,255,0.55)",
          glassDark: "rgba(255,255,255,0.18)",
          glow: "#a8e6ff",
          leaf: "#8be28f",
          deep: "#0b3d63",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 84, 130, 0.20)",
        glow: "0 0 24px rgba(168, 230, 255, 0.55)",
      },
      backdropBlur: { xs: "2px" },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
