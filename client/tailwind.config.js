/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F5FF',
          100: '#E0EBFF',
          200: '#C7D9FE',
          300: '#A4C1FD',
          400: '#759FF9',
          500: '#3B76F6',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#0F1E3D',
          950: '#0A1329',
        },
        navy: {
          800: '#111E38',
          900: '#0B1528',
          950: '#070D1B',
        }
      },
    },
  },
  plugins: [],
}

