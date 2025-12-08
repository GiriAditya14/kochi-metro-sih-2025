/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kmrl': {
          'primary': '#1a365d',    // Deep navy - KMRL brand
          'secondary': '#2c5282',  // Medium blue
          'accent': '#ed8936',     // Orange accent
          'success': '#38a169',    // Green for valid/ok
          'warning': '#d69e2e',    // Yellow for warnings
          'danger': '#e53e3e',     // Red for errors/critical
          'light': '#edf2f7',      // Light gray background
          'dark': '#1a202c',       // Dark text
        }
      },
      fontFamily: {
        'display': ['Outfit', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}

