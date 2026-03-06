/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#0A0C10",
        surface: "#111318",
        panel: "#161920",
        border: "#1E2229",
        muted: "#2A2F3A",
        amber: {
          glow: "#F59E0B",
          dim: "#92600A",
          faint: "#1A1205",
        },
        text: {
          primary: "#E8EAF0",
          secondary: "#8A909E",
          muted: "#4A5060",
        }
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        sans: ["'DM Sans'", "sans-serif"],
        display: ["'Instrument Serif'", "serif"],
      },
      animation: {
        "pulse-amber": "pulseAmber 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "blink": "blink 1s step-end infinite",
      },
      keyframes: {
        pulseAmber: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        }
      }
    },
  },
  plugins: [],
};
