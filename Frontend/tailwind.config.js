/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        hand: ['Caveat', 'cursive'],
      },
      colors: {
        paper: {
          DEFAULT: '#faf7f2',
          dark: '#f3efe7',
        },
        ink: {
          DEFAULT: '#1c1917',
          soft: '#57534e',
          faint: '#a8a29e',
        },
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
        },
        coral: '#e5484d',
        leaf: '#2f9e6e',
        gold: '#d97706',
      },
    },
  },
  plugins: [],
}
