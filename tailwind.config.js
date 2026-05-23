/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 方舟经典黑、黄、蓝配色
        arkGray: "#121212",
        arkDark: "#0a0a0a",
        arkOrange: "#f2a104",
        arkBlue: "#00b4d8",
      }
    },
  },
  plugins: [],
}