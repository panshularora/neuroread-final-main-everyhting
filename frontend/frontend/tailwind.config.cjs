/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        moss: '#2E4036',
        clay: '#CC5833',
        cream: '#F2F0E9',
        charcoal: '#1A1A1A'
      },
      fontFamily: {
        sans: ['"OpenDyslexic"', 'sans-serif'],
        display: ['"OpenDyslexic"', 'sans-serif'],
        serif: ['"OpenDyslexic"', 'sans-serif'],
        mono: ['"OpenDyslexic Mono"', '"OpenDyslexic"', 'monospace'],
        inter: ['"OpenDyslexic"', 'sans-serif'],
        playfair: ['"OpenDyslexic"', 'sans-serif']
      },
      fontSize: {
        'xs': ['calc(0.75rem + var(--font-scale)*1px)', { lineHeight: 'calc(1rem * var(--line-spacing))' }],
        'sm': ['calc(0.875rem + var(--font-scale)*1.5px)', { lineHeight: 'calc(1.25rem * var(--line-spacing))' }],
        'base': ['calc(1rem + var(--font-scale)*2px)', { lineHeight: 'calc(1.5rem * var(--line-spacing))' }],
        'lg': ['calc(1.125rem + var(--font-scale)*2.5px)', { lineHeight: 'calc(1.75rem * var(--line-spacing))' }],
        'xl': ['calc(1.25rem + var(--font-scale)*3px)', { lineHeight: 'calc(1.75rem * var(--line-spacing))' }],
        '2xl': ['calc(1.5rem + var(--font-scale)*3.5px)', { lineHeight: 'calc(2rem * var(--line-spacing))' }],
        '3xl': ['calc(1.875rem + var(--font-scale)*4px)', { lineHeight: 'calc(2.25rem * var(--line-spacing))' }],
        '4xl': ['calc(2.25rem + var(--font-scale)*4.5px)', { lineHeight: 'calc(2.5rem * var(--line-spacing))' }],
        '5xl': ['calc(3rem + var(--font-scale)*5px)', { lineHeight: 'calc(1 * var(--line-spacing))' }],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    }
  },
  plugins: []
};

