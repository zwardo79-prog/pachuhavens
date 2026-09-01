/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: { 50: '#ecfdf5', 100: '#d1fae5', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22' },
        gold: { 50: '#fffbeb', 100: '#fef3c7', 300: '#fcd34d', 400: '#fbbf24', 600: '#d97706', 700: '#b45309', 800: '#92400e' },
      },
      boxShadow: { card: '0 12px 34px -18px rgba(2, 44, 34, .25)' },
    },
  },
  plugins: [],
};
