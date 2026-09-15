/**
 * Calzy Design System Tokens
 * Standardized design tokens for colors, spacing, radius, shadows, and typography.
 */

export const tokens = {
  colors: {
    primary: {
      DEFAULT: "#10B981", // Emerald 500 - Vibrant health green
      hover: "#059669",   // Emerald 600
      light: "#D1FAE5",   // Emerald 100 - Gentle pill backgrounds
      dark: "#065F46",    // Emerald 800 - High contrast text
    },
    secondary: {
      DEFAULT: "#0D9488", // Teal 600 - Calm supporting accent
      hover: "#0F766E",   // Teal 700
      light: "#CCFBF1",   // Teal 100
      dark: "#115E59",    // Teal 800
    },
    surface: {
      canvas: "#F8FAFC",  // Slate 50 - Off-white backdrop
      card: "#FFFFFF",    // Crisp white elevated card
      subtle: "#F1F5F9",  // Slate 100 - Neutral segment / chip
      border: "#E2E8F0",  // Slate 200 - Soft dividing borders
      hover: "#F8FAFC",
    },
    text: {
      primary: "#0F172A",   // Slate 900 - Deep readable text
      secondary: "#475569", // Slate 600 - Readable subtitles
      muted: "#94A3B8",     // Slate 400 - Placeholder / helper
      inverse: "#FFFFFF",
    },
    status: {
      success: "#10B981", // Emerald 500
      warning: "#F59E0B", // Amber 500
      error: "#EF4444",   // Red 500
      info: "#3B82F6",    // Blue 500
    },
    macros: {
      protein: "#3B82F6", // Blue
      carbs: "#F59E0B",   // Warm amber
      fat: "#EC4899",     // Rose pink
    }
  },
  radius: {
    sm: "0.375rem",  // 6px
    md: "0.5rem",    // 8px
    lg: "0.75rem",   // 12px
    xl: "1rem",      // 16px
    "2xl": "1.25rem", // 20px - Card standard
    "3xl": "1.5rem",  // 24px - Featured container
    full: "9999px",  // Pill buttons
  },
  shadows: {
    card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
    floating: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
    accentGlow: "0 4px 14px 0 rgba(16, 185, 129, 0.25)",
  }
} as const;

export type DesignTokens = typeof tokens;
