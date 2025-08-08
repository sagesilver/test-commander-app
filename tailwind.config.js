/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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