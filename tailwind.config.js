/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#1E3A5F',
        salmon: '#C87F6B',
        'salmon-light': '#FBF0ED',
      },
    },
  },
  plugins: [],
}
