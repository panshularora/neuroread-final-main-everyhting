/** @type {import('tailwindcss').Config} */

// Colours are CSS variables (space-separated RGB channels) defined in
// src/index.css, so the reading themes and dark mode can swap them at runtime
// and opacity modifiers like `bg-moss/10` keep working.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

// Every text size grows with the reader's "Text size" setting (--font-scale).
const size = (rem, step, leading) => [
  `calc(${rem}rem + var(--font-scale) * ${step}px)`,
  { lineHeight: leading },
];

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: token('bg'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        primary: token('primary'),
        accent: token('accent'),
        ok: token('ok'),
        warn: token('warn'),
        err: token('err'),
        // Names used throughout the original components.
        moss: token('primary'),
        clay: token('accent'),
        cream: token('bg'),
        charcoal: token('ink'),
        'text-muted': token('muted'),
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        serif: ['var(--font-body)'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: size(0.8125, 1, 'var(--line-spacing)'),
        sm: size(0.9375, 1.5, 'var(--line-spacing)'),
        base: size(1.0625, 2, 'var(--line-spacing)'),
        lg: size(1.1875, 2.5, 'var(--line-spacing)'),
        xl: size(1.3125, 3, 'calc(var(--line-spacing) * 0.9)'),
        '2xl': size(1.5625, 3.5, 'calc(var(--line-spacing) * 0.85)'),
        '3xl': size(1.875, 4, 'calc(var(--line-spacing) * 0.8)'),
        '4xl': size(2.25, 4.5, 'calc(var(--line-spacing) * 0.75)'),
        '5xl': size(2.75, 5, 'calc(var(--line-spacing) * 0.72)'),
      },
      borderRadius: {
        xl: '0.625rem',
        '2xl': '0.875rem',
        '3xl': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(28 36 40 / 0.06), 0 1px 1px rgb(28 36 40 / 0.04)',
        raised: '0 8px 24px -12px rgb(28 36 40 / 0.22)',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
