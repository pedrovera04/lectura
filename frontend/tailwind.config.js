/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Fuente redondeada y legible, ideal para lectura infantil.
        sans: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b6d8ff',
          300: '#84bcff',
          400: '#4a97ff',
          500: '#1f72ff',
          600: '#0a56e6',
          700: '#0a45b4',
          800: '#0e3a8f',
          900: '#123471',
        },
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.4)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        'grow-bar': {
          '0%': { width: '0%' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.4s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4,0,0.6,1) infinite',
        'grow-bar': 'grow-bar 0.9s ease-out both',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
