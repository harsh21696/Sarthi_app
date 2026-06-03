/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50:  '#fdf8f0',
          100: '#faefd8',
          200: '#f4dcaa',
          300: '#ecc272',
          400: '#e29e3e',
          500: '#d4821f',
          600: '#b86515',
          700: '#974d14',
          800: '#7a3e17',
          900: '#643416',
          950: '#3d1f0a',
        },
        dark: {
          900: '#0a0f0a',
          800: '#111a11',
          700: '#172317',
          600: '#1e2e1e',
          500: '#263326',
        }
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'slide-in-left':'slideInLeft 0.3s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'wave':         'wave 1.5s ease-in-out infinite',
        'spin-slow':    'spin 3s linear infinite',
        'bounce-slow':  'bounce 2s infinite',
      },
      keyframes: {
        fadeIn:      { from: { opacity: '0' },                        to: { opacity: '1' } },
        slideUp:     { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        wave:        { '0%,100%': { transform: 'scaleY(1)' }, '50%': { transform: 'scaleY(2)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
