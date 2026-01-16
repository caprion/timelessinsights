/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./site/index.html",
    "./site/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Crimson Pro', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        purple: {
          600: '#9333ea',
          700: '#6d28d9',
          900: '#4c1d95',
        }
      }
    },
  },
  plugins: [],
}
