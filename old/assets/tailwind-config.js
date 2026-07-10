/**
 * Shared Tailwind CDN config for login.html and index.html. Every color,
 * radius, and font token below resolves to a CSS custom property (--color-*,
 * --radius-*, --font-sans) that theme-auth.js sets at runtime from
 * GET /api/admin/theme — nothing here is a hardcoded value.
 */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background:      'rgb(var(--color-background-rgb) / <alpha-value>)',
        surface:         'rgb(var(--color-surface-rgb) / <alpha-value>)',
        card:            'rgb(var(--color-card-rgb) / <alpha-value>)',
        'card-hover':    'rgb(var(--color-card-hover-rgb) / <alpha-value>)',
        divider:         'rgb(var(--color-divider-rgb) / <alpha-value>)',
        'divider-light': 'rgb(var(--color-divider-light-rgb) / <alpha-value>)',
        muted:           'rgb(var(--color-muted-rgb) / <alpha-value>)',
        subtle:          'rgb(var(--color-subtle-rgb) / <alpha-value>)',
        foreground:      'rgb(var(--color-foreground-rgb) / <alpha-value>)',
        accent:          'rgb(var(--color-accent-rgb) / <alpha-value>)',
        'accent-hover':  'rgb(var(--color-accent-hover-rgb) / <alpha-value>)',
        'accent-light':  'rgb(var(--color-accent-light-rgb) / <alpha-value>)',
        'accent-vivid':  'rgb(var(--color-accent-vivid-rgb) / <alpha-value>)',
        cyan:            'rgb(var(--color-cyan-rgb) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(40px, -60px) scale(1.15)' },
          '66%': { transform: 'translate(-30px, 30px) scale(0.9)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        blob: 'blob 14s infinite ease-in-out',
        shimmer: 'shimmer 5s linear infinite',
        floatY: 'floatY 4s ease-in-out infinite',
        marquee: 'marquee 22s linear infinite',
      },
    },
  },
};
