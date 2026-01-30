/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Team-based Colors for Compadels
        sb: {
          magenta: '#69BE28',  // Seahawks green as primary
          fuchsia: '#4A9E1C',  // Darker green
          pink: '#8CD450',     // Lighter green
          purple: '#002244',   // Navy (shared by both teams)
          cyan: '#C60C30',     // Patriots red as accent
          teal: '#A00A28',     // Darker red
          gold: '#FACC15',
          silver: '#C0C0C0',
        },
        // Seahawks Colors
        seahawks: {
          navy: '#002244',
          green: '#69BE28',
          grey: '#A5ACAF',
        },
        // Patriots Colors
        patriots: {
          navy: '#002244',
          red: '#C60C30',
          silver: '#B0B7BC',
        },
        // Neon accents
        neon: {
          cyan: '#C60C30',
          green: '#69BE28',
          pink: '#C60C30',
          magenta: '#69BE28',
        },
        // Dark theme - navy based
        dark: {
          900: '#0A1628',
          800: '#0F1E32',
          700: '#15263D',
          600: '#1B2E48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.5s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'gradient-x': 'gradient-x 15s ease infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': {
            boxShadow: '0 0 5px #69BE28, 0 0 10px #69BE28, 0 0 20px #69BE28',
            borderColor: '#69BE28'
          },
          '50%': {
            boxShadow: '0 0 10px #C60C30, 0 0 20px #C60C30, 0 0 40px #C60C30',
            borderColor: '#C60C30'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow': {
          '0%': { textShadow: '0 0 10px #69BE28, 0 0 20px #69BE28' },
          '100%': { textShadow: '0 0 20px #C60C30, 0 0 40px #C60C30' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'sb-gradient': 'linear-gradient(135deg, #0A1628 0%, #002244 25%, #69BE28 100%)',
        'sb-radial': 'radial-gradient(ellipse at top, #69BE28 0%, #002244 50%, #0A1628 100%)',
      },
    },
  },
  plugins: [],
}
