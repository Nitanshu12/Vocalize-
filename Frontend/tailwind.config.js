/** @type {import('tailwindcss').Config} */
// Every colour and face resolves to a token in src/tokens.css.
const c = (name) => `oklch(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
      },
      colors: {
        // Roasted-brown ground, warm white ink, khaki signal, cream highlight.
        paper: { DEFAULT: c('paper'), dark: c('paper-2'), deep: c('paper-3') },
        surface: { DEFAULT: c('paper-2'), raised: c('paper-3') },
        olive: c('olive'),
        ink: { DEFAULT: c('ink'), soft: c('ink-2'), faint: c('muted') },
        rule: c('rule'),
        accent: { DEFAULT: c('accent'), soft: c('accent-2'), ink: c('accent-ink') },
        // The old brand scale, kept by name so app screens keep working.
        brand: {
          50: c('paper-3'),
          100: c('paper-3'),
          200: c('olive'),
          600: c('accent'),
          700: c('accent'),
          800: c('accent-2'),
        },
        coral: c('error'),
        leaf: c('success'),
        gold: c('warn'),
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
      maxWidth: {
        container: 'var(--container)',
      },
    },
  },
  plugins: [],
}
