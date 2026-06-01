import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        '7': 'repeat(7, minmax(0, 1fr))',
      },
      colors: {
        // npuu.uz official brand palette — primary teal #086D7A
        primary: {
          50:  '#eef7f8',
          100: '#ceeaed',
          200: '#9dd5db',
          300: '#08B1BF',
          400: '#0a8a99',
          500: '#0C6E7D',
          600: '#086D7A',  // main brand color
          700: '#065a65',
          800: '#064A52',
          900: '#002532',  // dark navy (used in headers/dark backgrounds)
        },
        // npuu.uz secondary blue
        secondary: {
          500: '#195A91',
          600: '#114673',
        },
      },
    },
  },
  plugins: [],
};

export default config;
