/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./site/index.html",
    "./site/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Libre Baskerville', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          100: '#f9ddd8',
          200: '#f0b5ad',
          300: '#e06b55',
          400: '#d4573f',
          500: '#c2452d',
          600: '#a83a26',
          700: '#8e301f',
          800: '#742618',
          900: '#5a1c11',
        },
        forest: {
          100: '#e6f2ef',
          200: '#b8d9d0',
          300: '#4d9e8a',
          400: '#2d7a64',
          500: '#1a5c4c',
          600: '#155245',
          700: '#10403a',
        },
        earth: {
          bg: '#faf6f0',
          surface: '#ffffff',
          border: '#ede4d5',
          text: '#3d2b1f',
          muted: '#8b7560',
        },
      }
    },
  },
  plugins: [],
}
