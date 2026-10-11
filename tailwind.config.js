/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      colors: {
        ink: '#22243a',
        muted: '#898ba0',
        violet: '#7565e8',
        paper: '#f7f8fc',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(39, 42, 76, 0.05)',
      },
    },
  },
  plugins: [],
}
