/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "light-green": "#24b8a5",
        "dark-green": "#15284f",
        white: "#fdfdfe",
      },
      fontFamily: {
        heading: ["Cinzel", "serif"],
        body: ["Merriweather", "serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwind-scrollbar"),
    require("tailwindcss-animate"),
  ],
};
