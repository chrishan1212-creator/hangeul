import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        jua: ["var(--font-jua)"],
        gaegu: ["var(--font-gaegu)"],
      },
      colors: {
        candy: {
          pink: "#FF6FB5",
          purple: "#9B6BFF",
          blue: "#4FC3F7",
          yellow: "#FFD93D",
          green: "#5CE0A0",
          orange: "#FF9F5B",
        },
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.3) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(3deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(360deg)", opacity: "0.9" },
        },
        "gradient-move": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        float: "float 5s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.6s cubic-bezier(0.2, 0.7, 0.4, 1) infinite",
        wiggle: "wiggle 0.7s ease-in-out infinite",
        "confetti-fall": "confetti-fall linear forwards",
        "gradient-move": "gradient-move 12s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
