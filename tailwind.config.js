/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official SB LX Colors
        sb: {
          magenta: '#E91E8C',
          fuchsia: '#D946EF',
          pink: '#F472B6',
          purple: '#7C3AED',
          cyan: '#00D4FF',
          teal: '#06B6D4',
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
        // Neon accents (keeping some)
        neon: {
          cyan: '#00F5FF',
          green: '#39FF14',
          pink: '#FF10F0',
          magenta: '#E91E8C',
        },
        // Dark theme - with purple tint
        dark: {
          900: '#0D0015',
          800: '#150020',
          700: '#1F0A2E',
          600: '#2D1440',
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
            boxShadow: '0 0 5px #E91E8C, 0 0 10px #E91E8C, 0 0 20px #E91E8C',
            borderColor: '#E91E8C'
          },
          '50%': {
            boxShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF, 0 0 40px #00D4FF',
            borderColor: '#00D4FF'
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'glow': {
          '0%': { textShadow: '0 0 10px #E91E8C, 0 0 20px #E91E8C' },
          '100%': { textShadow: '0 0 20px #00D4FF, 0 0 40px #00D4FF' },
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
        'sb-gradient': 'linear-gradient(135deg, #0D0015 0%, #2D1440 25%, #E91E8C 100%)',
        'sb-radial': 'radial-gradient(ellipse at top, #E91E8C 0%, #7C3AED 50%, #0D0015 100%)',
      },
    },
  },
  plugins: [],
}
