/** @type {import('tailwindcss').Config} */
export default {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        modal: "modal 0.3s ease-out",
        app: "app 0.6s cubic-bezier(0, 0.5, 0.25, 1)",
        hide: "modal 0.3s ease-in",
        shake: "shake 0.6s ease-in-out",
      },
      keyframes: {
        modal: {
          "0%": { transform: "scale(0.9)", filter: "blur(2px)" },
          "25%": { transform: "scale(0.95)", filter: "blur(1px)" },
          "50%": { transform: "scale(0.98)", filter: "blur(0.5px)" },
          "100%": { transform: "scale(1)", filter: "blur(0px)" },
        },
        app: {
          "0%": { transform: "scale(2)", filter: "blur(2px)" },
          "25%": { transform: "scale(1.5)", filter: "blur(1px)" },
          "50%": { transform: "scale(1.25)", filter: "blur(0.5px)" },
          "100%": { transform: "scale(1)", filter: "blur(0px)" },
        },
        hide: {
          "0%": { transform: "scale(1)", filter: "blur(0px)" },
          "25%": { transform: "scale(0.98)", filter: "blur(0.5px)" },
          "50%": { transform: "scale(0.95)", filter: "blur(1px)" },
          "100%": { transform: "scale(0.9)", filter: "blur(2px)" },
        },
        shake: {
          "0%": { transform: "translateX(0px)" },
          "25%": { transform: "translateX(-1px)" },
          "50%": { transform: "translateX(1px)" },
          "75%": { transform: "translateX(-1px)" },
          "100%": { transform: "translateX(0px)" },
        },
      },
      transitionProperty: {
        'height': 'height'
      }
    },
  },
  plugins: [
  ],
}

