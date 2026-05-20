import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
      },
      colors: {
        background: "#03040a",
        foreground: "#f8fbff",
        muted: "#8a93a6",
        border: "rgba(255,255,255,0.12)",
        card: "rgba(9,13,28,0.68)",
        cyan: "#5ee7ff",
        violet: "#9d7cff",
        emerald: "#5fffc2"
      },
      boxShadow: {
        glow: "0 0 40px rgba(94, 231, 255, 0.22)",
        violet: "0 0 60px rgba(157, 124, 255, 0.28)"
      },
      keyframes: {
        aurora: {
          "0%,100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "50%": { transform: "translate3d(2%, -3%, 0) rotate(7deg)" }
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        },
        pulseEdge: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        aurora: "aurora 16s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        "pulse-edge": "pulseEdge 2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
