export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        disc: { d: '#E63946', i: '#F4A261', s: '#2A9D8F', c: '#264653' },
        brand: {
          50: '#f0f4ff', 100: '#dbe4ff', 200: '#bac8ff', 300: '#91a7ff',
          400: '#748ffc', 500: '#5c7cfa', 600: '#4c6ef5', 700: '#4263eb',
          800: '#3b5bdb', 900: '#364fc7', 950: '#1e2a5e',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
