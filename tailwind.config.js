/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          dim: '#0f0f0f',
          bright: '#2a2a2a',
          container: { DEFAULT: '#1a1a1a', low: '#151515', high: '#222222', highest: '#2d2d2d', lowest: '#0a0a0a' },
          variant: '#2d2d2d',
          tint: '#d4a853',
        },
        primary: { DEFAULT: '#d4a853', container: '#7a6230', fixed: '#f0d48a', 'fixed-dim': '#d4a853' },
        secondary: { DEFAULT: '#c4b99a', container: '#4a4535' },
        tertiary: { DEFAULT: '#a8b8d8', container: '#4a5570' },
        outline: { DEFAULT: '#6b6355', variant: '#3d3830' },
        on: {
          surface: '#ededed', 'surface-variant': '#bfb5a8', background: '#ededed',
          primary: '#1a1200', 'primary-container': '#fff8e8', 'primary-fixed': '#2c1f00',
          secondary: '#2d2a22', 'secondary-container': '#d4cbb5',
          tertiary: '#1a2440', 'tertiary-container': '#e8eeff',
          error: '#690005',
        },
        error: { DEFAULT: '#ffb4ab', container: '#93000a' },
        disc: { d: '#E63946', i: '#F4A261', s: '#2A9D8F', c: '#264653' },
        gold: {
          50: '#fdf9ef', 100: '#f9f0d5', 200: '#f0d48a', 300: '#e8c060',
          400: '#d4a853', 500: '#c4942e', 600: '#a67624', 700: '#7a5a20',
          800: '#5c4318', 900: '#3d2d10', 950: '#1a1200',
        },
      },
      fontFamily: {
        headline: ['"Noto Serif"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
        label: ['"Manrope"', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
