/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C96E',
          dark: '#8B6914',
        },
        // cream agora é o texto principal (marrom escuro quente)
        cream: '#2C2416',
        // dark agora aponta para os beges de fundo
        dark: {
          base: '#F5F0E8',
          surface: '#EDE8DC',
        },
        paper: {
          DEFAULT: '#F5F0E8',
          dark: '#EDE8DC',
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
