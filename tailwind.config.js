/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme tokens via CSS variables (supporting opacity)
        surface: 'rgb(var(--tc-surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--tc-surface-muted) / <alpha-value>)',
        card: 'rgb(var(--tc-card) / <alpha-value>)',
        foreground: 'rgb(var(--tc-foreground) / <alpha-value>)',
        muted: 'rgb(var(--tc-muted) / <alpha-value>)',
        subtle: 'rgb(var(--tc-border-subtle) / <alpha-value>)',
        icon: 'rgb(var(--tc-icon) / <alpha-value>)',
        contrast: 'rgb(var(--tc-contrast) / <alpha-value>)',
        menu: 'rgb(var(--tc-menu) / <alpha-value>)',

        // Existing palette retained for compatibility
        primary: {
          light: '#eaf2fb',
          DEFAULT: '#3762c4',
          dark: '#22386b',
        },
        slate: {
          light: '#f7f9fa',
          DEFAULT: '#606a78',
          dark: '#23272f',
        },
        accent: {
          light: '#e5f5f6',
          DEFAULT: '#36b1ae',
          amber: '#f7c873',
        },
        white: '#ffffff',
        black: '#101315',
        charcoal: '#2d3340',
        grey: {
          light: '#e3e7ed',
          mid: '#b3bbc9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1.25rem',
        xl: '1.5rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(44, 56, 100, 0.08)',
      },
    },
  },
  plugins: [],
}