import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf6f0",
          100: "#fbe8d5",
          200: "#f6ceaa",
          300: "#f0ae75",
          400: "#e9883e",
          500: "#e4701e",
          600: "#d55914",
          700: "#b14313",
          800: "#8d3617",
          900: "#732e15",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
