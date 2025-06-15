/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        'calc-95-4/3': 'calc((100vh - 103px) * 4 / 3)',
        'calc-95-4/3-mobile': 'calc((100vh - 134px) * 4 / 3)',
      },
      fontFamily: {
        outfit: ["'Outfit'", "sans-serif"],
        poppins: ['Poppins', 'sans-serif'],
        lexend: ['Lexend', 'sans-serif'],
      },
      screens: {
        'max-sm': {'max': '600px'}, // custom max-width breakpoint
        'max-420': {'max': '420px'},
        'max-330': {'max': '330px'},
        'max-720': {'max': '720px'},
      },
      keyframes: {
        pulseGlowScale: {
          '0%, 100%': {
            'box-shadow': '0 0 8px 3px rgba(252, 165, 165, 0.7)',
            transform: 'scale(1)',
          },
          '50%': {
            'box-shadow': '0 0 20px 6px rgba(252, 165, 165, 1)',
            transform: 'scale(1.05)',
          },
        },
      },
      animation: {
        pulseGlowScale: 'pulseGlowScale 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio')],
}

