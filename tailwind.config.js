/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#edfcf9',
          100: '#d0f7ef',
          200: '#a4eedf',
          300: '#6adfc9',
          400: '#00e6c8',
          500: '#00c4ab',
          600: '#00a18e',
          700: '#008174',
          800: '#006660',
          900: '#054d48',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8f9fc',
          100: '#f1f3f8',
          200: '#e4e7ef',
          300: '#d0d4e0',
          400: '#9da3b4',
          500: '#6b7280',
          600: '#4b5060',
          700: '#353845',
          800: '#1e2030',
          900: '#0f1117',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
