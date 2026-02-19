import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf6ef',
          100: '#faeaD8',
          200: '#f5d0a9',
          300: '#edb175',
          400: '#e3903f',
          500: '#c9721f',
          600: '#B4651E',
          700: '#8f4e16',
          800: '#6e3c12',
          900: '#1e2d3d',
        },
      },
      textColor: {  // ✅ ADDED
        DEFAULT: '#000000',
      },
    },
  },
  plugins: [],
}

export default config