/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // App chrome palette (independent of the design tokens being reviewed)
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b0b9c8",
          400: "#8593a8",
          500: "#65748c",
          600: "#505d73",
          700: "#424c5e",
          800: "#394150",
          900: "#1f242e",
          950: "#13161d",
        },
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598cff",
          500: "#3563ff",
          600: "#1f43f5",
          700: "#1731e1",
          800: "#1929b6",
          900: "#1b2a8f",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.08)",
        drawer: "-12px 0 40px -12px rgb(16 24 40 / 0.25)",
      },
    },
  },
  plugins: [],
};
