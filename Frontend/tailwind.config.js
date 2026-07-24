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
        // "Ocean · Teal" design system — cool mist paper, teal-black ink, a
        // single teal brand voice. Semantic feedback colors (coral/leaf/gold)
        // stay separate from the brand and must not be reused as the accent.
        paper: {
          DEFAULT: '#f1f6f5',
          dark: '#e6efee',
        },
        ink: {
          DEFAULT: '#0f2a2e',
          soft: '#4c6b6e',
          faint: '#8fa8aa',
        },
        brand: {
          50:  '#eaf6f5',
          100: '#d3ebe9',
          200: '#a7d8d4',
          600: '#0e7c86',
          700: '#0b636b',
          800: '#094e55',
        },
        coral: '#e5484d',
        leaf: '#2f9e6e',
        gold: '#d97706',
      },
    },
  },
  plugins: [],
}
