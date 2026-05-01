/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans Variable', 'sans-serif'],
      },
      colors: {
        accent: "#16a34a",  
        background: "var(--background)",
        foreground: "var(--foreground)",

        card: "var(--card)",
        border: "var(--border)",

        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",

        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",

        sidebar: "var(--sidebar)",
        "sidebar-foreground": "var(--sidebar-foreground)",

        /* status colors (needed for KPI cards) */
        "status-ongoing": "var(--status-ongoing)",
        "status-completed": "var(--status-completed)",
        "status-delayed": "var(--status-delayed)",
        "status-utilization": "var(--status-utilization)",
      },
    },
  },

  plugins: [],
};