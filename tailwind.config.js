/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        modal: "modal 0.3s ease-out",
      },
      keyframes: {
        modal: {
          "0%": { transform: "scale(0.9)", filter: "blur(4px)" },
          "100%": { transform: "scale(1)", filter: "blur(0px)" },
        }
      }
    },
  },
  plugins: [],
}

