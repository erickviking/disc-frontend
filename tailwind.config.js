/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131313',
          dim: '#131313',
          bright: '#393939',
          container: { DEFAULT: '#20201f', low: '#1c1b1b', high: '#2a2a2a', highest: '#353535', lowest: '#0e0e0e' },
          variant: '#353535',
          tint: '#e7beae',
        },
        primary: { DEFAULT: '#e7beae', container: '#8c6a5d', fixed: '#ffdbce', 'fixed-dim': '#e7beae' },
        secondary: { DEFAULT: '#cec5c0', container: '#4c4642' },
        tertiary: { DEFAULT: '#b8c6eb', container: '#637192' },
        outline: { DEFAULT: '#9c8e88', variant: '#504440' },
        on: {
          surface: '#e5e2e1', 'surface-variant': '#d4c3bd', background: '#e5e2e1',
          primary: '#442a20', 'primary-container': '#fff6f3', 'primary-fixed': '#2c160c',
          secondary: '#352f2d', 'secondary-container': '#bcb3af',
          tertiary: '#22304e', 'tertiary-container': '#f6f6ff',
          error: '#690005',
        },
        error: { DEFAULT: '#ffb4ab', container: '#93000a' },
        disc: { d: '#E63946', i: '#F4A261', s: '#2A9D8F', c: '#264653' },
      },
      fontFamily: {
        headline: ['"Noto Serif"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
        label: ['"Manrope"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
