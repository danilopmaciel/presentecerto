import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff6f0',
          100: '#ffe8d6',
          200: '#ffc9a0',
          300: '#ffa96a',
          400: '#ff8a3d',
          500: '#ff6b1a',
          600: '#e8560b',
          700: '#b9430a',
          800: '#88300a',
          900: '#561f08'
        }
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
