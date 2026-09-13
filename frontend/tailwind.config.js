/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        soc: {
          950: '#FDFDFB',
          900: '#ffffff',
          850: '#F4FBF3',
          800: '#E6F5E8',
          700: '#CBE8CF',
          600: '#91C99A',
          500: '#6EAA79',
          400: '#6B403C',
          300: '#6B403C',
          200: '#6B403C',
          100: '#6B403C'
        },
        threat: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#10b981',
          info: '#06b6d4'
        },
        cyber: {
          cyan: '#FF857A',
          amber: '#FF857A',
          emerald: '#ADEBB3',
          rose: '#EBAEE6',
          violet: '#6B403C'
        },
        cyan: {
          50: '#FFF4F2', 100: '#FFE5E1', 200: '#FFD0CA', 300: '#FFACA3',
          400: '#FF998F', 500: '#FF857A', 600: '#FF857A', 700: '#E66E65',
          800: '#C85D57', 900: '#6B403C', 950: '#6B403C'
        },
        amber: { 400: '#FF857A', 500: '#FF857A', 600: '#E66E65', 950: '#FFF0EE' },
        emerald: { 400: '#6EAA79', 500: '#ADEBB3', 600: '#91C99A', 950: '#EFFAF0' },
        violet: { 400: '#9C6D96', 500: '#EBAEE6', 600: '#C98BC1', 950: '#FBF0F9' }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
