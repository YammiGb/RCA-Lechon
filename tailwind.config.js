/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rca: {
          green: '#2D7659',
          'green-light': '#4a9f7d',
          'green-dark': '#1a4434',
          red: '#DC143C',
          'red-dark': '#C71C1C',
          'off-white': '#F8F8F7',
          white: '#FFFFFF',
          'text-dark': '#1a1a1a',
          'text-light': '#666666'
        },
        cafe: {
          accent: '#DC143C',
          dark: '#2D7659',
          cream: '#F8F8F7',
          beige: '#F8F8F7',
          latte: '#E8E8E6',
          espresso: '#1a1a1a',
          light: '#FEFCFB'
        }
      },
      fontFamily: {
        'pretendard': ['Pretendard', 'system-ui', 'sans-serif'],
        'noto-kr': ['Noto Serif KR', 'serif'],
        'noto': ['Noto Serif', 'serif'],
        'playfair': ['Playfair Display', 'serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
          '60%': { transform: 'translateY(-2px)' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
};