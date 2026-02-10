/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm Earth Retro Palette
        'bg-deep': '#1a1512',
        'bg-warm': '#2a2118',
        'bg-elevated': '#3a2f24',
        'bg-surface': '#4a3d30',
        // Unique Color Scheme - Retro Futurism
        'accent-burnt': '#d4622a',
        'accent-teal': '#2a7d7d',
        'accent-amber': '#d4a542',
        'accent-olive': '#6b7d4a',
        'accent-rust': '#a84a3a',
        'accent-sage': '#7d9d8a',
        // Typography
        'text-primary': '#f5e6d3',
        'text-secondary': '#d4c4a8',
        'text-tertiary': '#9d8d73',
        // Glass with warm tint
        'glass-warm': 'rgba(212, 166, 98, 0.08)',
        'glass-warm-strong': 'rgba(212, 166, 98, 0.15)',
        'glass-border': 'rgba(212, 166, 98, 0.2)',
        'glass-highlight': 'rgba(255, 220, 150, 0.3)',
      },
      fontFamily: {
        display: ['Libre Baskerville', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      backdropBlur: {
        retro: '30px',
      },
      boxShadow: {
        'retro': '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 2px 0 rgba(255, 220, 150, 0.2), inset 0 -2px 0 rgba(0, 0, 0, 0.3)',
        'retro-card': '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 220, 150, 0.1)',
        'retro-button': '0 4px 16px rgba(212, 98, 42, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
        'retro-button-hover': '0 6px 24px rgba(212, 98, 42, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
      },
    },
  },
  plugins: [],
};
