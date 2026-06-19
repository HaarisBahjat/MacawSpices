/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spice: {
          50:  '#FFF8F0',
          100: '#FFEFD8',
          200: '#FFD9A8',
          300: '#FFBC6E',
          400: '#FF9A32',
          500: '#E8A020',   // turmeric gold
          600: '#C47A10',
          700: '#9A5A08',
          800: '#7A3F05',
          900: '#4A2402',
        },
        chilli: {
          50:  '#FFF3F0',
          100: '#FFE0D8',
          200: '#FFC0AD',
          300: '#FF8F75',
          400: '#E8613A',
          500: '#D94F2A',
          600: '#B5451B',   // paprika red
          700: '#8B3215',
          800: '#6B250F',
          900: '#4A1A0A',
        },
        bark: {
          50:  '#FAF5EF',
          100: '#F0E5D5',
          200: '#DCC8A8',
          300: '#C2A070',
          400: '#A87840',
          500: '#8A5C28',
          600: '#6D4418',
          700: '#52300E',
          800: '#3A2008',
          900: '#2D1B00',   // dark spice brown
        },
        cream: '#FFF8F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'spice-gradient': 'linear-gradient(135deg, #2D1B00 0%, #4A2402 50%, #8B3215 100%)',
        'gold-gradient': 'linear-gradient(135deg, #E8A020 0%, #FF9A32 100%)',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
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
        'spice': '0 4px 20px rgba(180, 69, 27, 0.2)',
        'gold': '0 4px 20px rgba(232, 160, 32, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
