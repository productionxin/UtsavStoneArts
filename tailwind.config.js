/** @type {import('tailwindcss').Config} */
export default {
  content: ['./receipt-vault.html', './src/receipt-vault/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
