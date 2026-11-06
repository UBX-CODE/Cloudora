/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Space Grotesk"', 'ui-monospace', 'monospace'],
      },
      colors: {
        pix: {
          purple: '#5033E1',       // Hero Electric Purple from Pixetivity
          'purple-dark': '#3C22BE', // Dark Purple
          dark: '#0B0A0F',         // Pitch Black Section Background
          surface: '#13121C',      // Card Surface
          card: '#161522',         // Card Dark Background
          border: '#232135',       // Subtle Card Border
          pink: '#FF5E97',         // Candy Pink Marquee & Stars
          cyan: '#00D2FF',         // Cyan Highlight Text
          yellow: '#FFD13B',       // Chunky Yellow Pill Buttons & Arrows
          'yellow-hover': '#F0C226',
        },
      },
      boxShadow: {
        'brutal-yellow': '4px 4px 0px #000000',
        'brutal-pink': '4px 4px 0px #000000',
        'brutal-card': '0px 10px 30px rgba(0,0,0,0.5)',
      },
      animation: {
        'marquee': 'marquee 35s linear infinite',
        'marquee-reverse': 'marquee-reverse 35s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
    },
  },
  plugins: [],
}
