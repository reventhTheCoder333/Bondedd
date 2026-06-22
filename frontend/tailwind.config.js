/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#B18025',
          light: '#C99A3A',
          dark: '#8A6419',
        },
        muted: '#6F6F6F',
        border: '#E9E9E9',
        placeholder: '#D9D9D9',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Sorts Mill Goudy"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '30px',
        pill: '1000px',
      },
      maxWidth: {
        page: '1280px',
      },
    },
  },
  plugins: [],
}
