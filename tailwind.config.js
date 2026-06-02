/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        night: { 950: "#070707", 900: "#0A0A0A", 850: "#0E0E0E", 800: "#131313", 700: "#1A1A1A", 600: "#242424" },
        gold: { 50: "#FBF3DE", 100: "#F2DDA8", 200: "#EDCB89", 300: "#E6B979", 400: "#D6AE63", 500: "#C6A559", 600: "#A9863F" },
        mute: "#8A8A8F",
      },
      letterSpacing: { tightest: "-0.04em" },
    },
  },
  plugins: [],
};
