/** @type {import('tailwindcss').Config} */
export default {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        modal: "modal 0.3s ease-out",
      },
      keyframes: {
        modal: {
          "0%": { transform: "scale(0.9)", filter: "blur(2px)" },
          "25%": { transform: "scale(0.95)", filter: "blur(1px)" },
          "50%": { transform: "scale(0.98)", filter: "blur(0.5px)" },
          "100%": { transform: "scale(1)", filter: "blur(0px)" },
        }
      }
    },
  },
  plugins: [
  ],
}

