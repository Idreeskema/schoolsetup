/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/index.html'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          50: '#e8eef5',
          100: '#c5d4e7',
          200: '#9fb8d7',
          300: '#789cc7',
          400: '#5888bb',
          500: '#3873ae',
          600: '#2d609a',
          700: '#1e3a5f',
          800: '#162d4a',
          900: '#0e1f35'
        },
        accent: {
          DEFAULT: '#f97316',
          light: '#fdba74',
          dark: '#ea580c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
}
