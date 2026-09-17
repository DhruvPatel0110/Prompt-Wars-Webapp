/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#070a13',
          card: '#0d1424',
          border: '#1f2b48',
          cyan: '#00f0ff',
          pink: '#ff007f',
          purple: '#8a2be2',
          green: '#00ff88',
          amber: '#ffb800',
          red: '#ff3366',
          blue: '#2563eb'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Rajdhani"', '"Orbitron"', 'sans-serif']
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite',
        'border-flow': 'borderFlow 4s linear infinite',
        'scanline': 'scanline 8s linear infinite'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 15px rgba(0, 240, 255, 0.6))' },
          '50%': { opacity: '0.7', filter: 'drop-shadow(0 0 5px rgba(0, 240, 255, 0.2))' }
        }
      }
    },
  },
  plugins: [],
}
