/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: '#F5F3F0',
        primary: {
          DEFAULT: '#1B6B5E',
          50: '#E8F4F1',
          100: '#C5E4DC',
          200: '#9ECFBF',
          300: '#77BAA3',
          400: '#50A587',
          500: '#1B6B5E',
          600: '#15574C',
          700: '#10433A',
          800: '#0A2F28',
          900: '#051B16',
        },
        surface: '#FFFFFF',
        border: '#E5E0D8',
        muted: '#8A8A8A',
        danger: '#DC2626',
        warning: '#D97706',
        success: '#059669',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-md': '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
