import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)',  'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)',  'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      spacing: {
        'sidebar': '240px',
        'header': '56px',
      },
      maxWidth: {
        'page': '1400px',
      },
      fontSize: {
        'body': ['14px', '1.5'],
      },
      borderRadius: {
        'card': '8px',
        'input': '6px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'scale-in': 'scale-in 300ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
