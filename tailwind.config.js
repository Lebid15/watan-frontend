// tailwind.config.js
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "ui-sans-serif", "system-ui"],
        arabic: ["TajawalVariable", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
