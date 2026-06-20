/** @type {import('tailwindcss').Config} */
const C_LIGHT = '#FBF5DD';
const C_BASE = '#E7E1B1';
const C_PRIMARY = '#306D29';
const C_DARK = '#0D530E';

const mappedColors = {
  50: C_LIGHT,
  100: C_LIGHT,
  200: C_BASE,
  300: C_BASE,
  400: C_BASE,
  500: C_PRIMARY,
  600: C_PRIMARY,
  700: C_DARK,
  800: C_DARK,
  900: C_DARK,
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Override colors completely to ensure no other color can be used
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: C_LIGHT,
      black: C_DARK,
      macaw: mappedColors,
      spice: mappedColors,
      chilli: mappedColors,
      bark: mappedColors,
      gray: mappedColors,
      red: mappedColors,
      green: mappedColors,
      blue: mappedColors,
      yellow: mappedColors,
      cream: C_LIGHT,
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'spice-gradient': `linear-gradient(135deg, ${C_DARK} 0%, ${C_PRIMARY} 50%, ${C_BASE} 100%)`,
        'gold-gradient': `linear-gradient(135deg, ${C_BASE} 0%, ${C_PRIMARY} 100%)`,
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230D530E' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'spice': '0 4px 20px rgba(48, 109, 41, 0.2)',
        'gold': '0 4px 20px rgba(48, 109, 41, 0.3)',
        'glass': '0 8px 32px rgba(13, 83, 14, 0.1)',
      },
    },
  },
  plugins: [],
}
