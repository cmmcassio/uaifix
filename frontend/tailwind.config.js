/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C96E',
        },
        cream: '#F0EDE4',
        dark: {
          base: '#0D1117',
          surface: '#1A1F2E',
        },
        terracotta: '#8B4513',
      },
      opacity: {
        22: '0.22',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
      },
    },
  },
  plugins: [],
}
