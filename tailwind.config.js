/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Mirrors the web palette so the two clients read as one product.
        primary: '#6153a3',
        'primary-dark': '#4c4085',
        'primary-soft': '#efedf7',
        surface: '#ffffff',
        background: '#f6f6fa',
        muted: '#6b7280',
        border: '#e5e7eb',
        destructive: '#dc2626',
        success: '#16a34a',
      },
    },
  },
};
