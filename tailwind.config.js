/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Questa riga dice a Tailwind di leggere sia JS che TSX in tutte le sottocartelle
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}