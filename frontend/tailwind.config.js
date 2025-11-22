/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-surface': '#1E1E2F', // Custom color for dark surface
        'dark-bg': '#121212',      // Background color
        'dark-text': '#E0E0E0',    // Text color
        'dark-text-secondary': '#B0B0B0', // Secondary text color
      },
    },
  },
  safelist: [
    'bg-dark-surface',
    'text-dark-text',
    'text-dark-text-secondary',
    'bg-dark-bg',
    'app-card',
    'app-heading',
    'app-label',
    'app-input',
    'app-select',
    'btn-primary',
    'btn-secondary',
  ],
  plugins: [],
};