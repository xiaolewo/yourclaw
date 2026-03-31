/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-color, #4F46E5)',
          light: 'var(--brand-color-light, #818CF8)',
        },
      },
    },
  },
  plugins: [],
}
