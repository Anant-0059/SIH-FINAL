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
        aqi: {
          good: "#16a34a",
          satisfactory: "#65a30d",
          moderate: "#ca8a04",
          poor: "#ea580c",
          veryPoor: "#dc2626",
          severe: "#7f1d1d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
