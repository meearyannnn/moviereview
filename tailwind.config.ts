import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      serif: ["'Outfit'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      display: ["'Outfit'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      cinema: ["'Outfit'", "'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      mono: ["'IBM Plex Mono'", "'JetBrains Mono'", "monospace"],
    },
    // NOTE: fontSize here REPLACES Tailwind's defaults, so every size the app
    // uses must be listed. 6xl–9xl were missing, which silently dropped
    // classes like text-6xl / text-7xl.
    fontSize: {
      xs: ["12px", { lineHeight: "16px", letterSpacing: "-0.01em" }],
      sm: ["14px", { lineHeight: "20px", letterSpacing: "-0.005em" }],
      base: ["16px", { lineHeight: "24px", letterSpacing: "-0.005em" }],
      lg: ["18px", { lineHeight: "28px", letterSpacing: "-0.005em" }],
      xl: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em" }],
      "2xl": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em" }],
      "3xl": ["30px", { lineHeight: "36px", letterSpacing: "-0.02em" }],
      "4xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em" }],
      "5xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em" }],
      "6xl": ["60px", { lineHeight: "1", letterSpacing: "-0.025em" }],
      "7xl": ["72px", { lineHeight: "1", letterSpacing: "-0.025em" }],
      "8xl": ["96px", { lineHeight: "1", letterSpacing: "-0.03em" }],
      "9xl": ["128px", { lineHeight: "1", letterSpacing: "-0.03em" }],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        primary: {
          DEFAULT: "#f5c542",
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#f5c542",
          600: "#c9a24b",
          700: "#a17d31",
          800: "#7c5e22",
          900: "#5a4216",
          foreground: "#1c120c",
        },
        secondary: {
          DEFAULT: "#140a0d",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#c9a24b",
          foreground: "#1c120c",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "#140a0d",
          foreground: "#f3e9d2",
          primary: "#f5c542",
          "primary-foreground": "#1c120c",
          accent: "#c9a24b",
          "accent-foreground": "#1c120c",
          border: "rgba(201, 162, 75, 0.2)",
          ring: "#f5c542",
        },
        // Cinema Design tokens
        'sc-bg': '#0a0608',
        'sc-surface': '#140a0d',
        'sc-card': '#1a0f14',
        'sc-accent': '#f5c542',
        'sc-gold': '#c9a24b',
        'sc-paper': '#f3e9d2',
        'sc-blue': '#38bdf8',
        'sc-cyan': '#22d3ee',
        // Verdict tiers (Meter + Reviews)
        tier: {
          pass: '#ef4444',
          decent: '#38bdf8',
          must: '#10b981',
          cinema: '#fbbf24',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      scale: {
        105: "1.05",
        110: "1.10",
        115: "1.15",
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
        normal: "0em",
        wide: "0.01em",
        wider: "0.02em",
        widest: "0.04em",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        glow: {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px rgba(251, 191, 36, 0.3)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 30px rgba(251, 191, 36, 0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        fadeIn: "fadeIn 0.6s ease-out forwards",
        slideUp: "slideUp 0.5s ease-out forwards",
        slideDown: "slideDown 0.5s ease-out forwards",
        slideInLeft: "slideInLeft 0.5s ease-out forwards",
        slideInRight: "slideInRight 0.5s ease-out forwards",
        scaleIn: "scaleIn 0.4s ease-out forwards",
        pulse: "pulse 2s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        breathe: "breathe 2.5s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
        glow: "0 0 20px rgba(251, 191, 36, 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;