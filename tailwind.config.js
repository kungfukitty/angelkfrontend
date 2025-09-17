/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#facc15',
          500: '#eab308'
        }
      }
    }
  },
  plugins: []
}
