/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // --- Root & Surface Scale (Obsidian Depths) ---
        'bg-primary': '#0B0D11',
        'bg-secondary': '#11141A',
        surface: '#14171F',
        'surface-dim': '#0E1117',
        'surface-bright': '#1A1E27',
        'surface-container-lowest': '#0B0D11',
        'surface-container-low': '#181C25',
        'surface-container': '#1C2029',
        'surface-container-high': '#222734',
        'surface-container-highest': '#282E3D',
        'surface-elevated': '#1C2029',
        'surface-modal': '#222734',
        'on-surface': '#F3F4F6',
        'on-surface-variant': '#9CA3AF',
        'inverse-surface': '#F3F4F6',
        'inverse-on-surface': '#14171F',
        outline: 'rgba(255, 255, 255, 0.12)',
        'outline-variant': 'rgba(255, 255, 255, 0.06)',
        'surface-tint': '#B9924F',

        // --- Brand & Interactive Gold Scale ---
        primary: '#B9924F',
        'on-primary': '#0B0D11',
        'primary-container': '#2A2416',
        'on-primary-container': '#D6B875',
        'primary-hover': '#C7A35F',
        'primary-focus': '#D6B875',
        'primary-soft': 'rgba(185, 146, 79, 0.12)',
        'primary-50': 'rgba(185, 146, 79, 0.10)',
        'primary-100': 'rgba(185, 146, 79, 0.18)',
        'primary-500': '#B9924F',
        'primary-600': '#C7A35F',
        'primary-700': '#A4803F',
        'primary-900': '#D6B875',
        'primary-950': '#E2CA94',

        // --- Typography Scale ---
        'text-primary': '#F3F4F6',
        'text-secondary': '#9CA3AF',
        'text-muted': '#8A93A0',
        'text-disabled': '#4B5563',
        'text-gold': '#D6B875',

        // --- Borders & Dividers ---
        'border-default': 'rgba(255, 255, 255, 0.08)',
        'border-subtle': 'rgba(255, 255, 255, 0.04)',
        'border-strong': 'rgba(255, 255, 255, 0.15)',
        'border-gold': 'rgba(185, 146, 79, 0.18)',
        'border-gold-focus': 'rgba(185, 146, 79, 0.40)',

        // --- Muted Semantic Scale ---
        'semantic-green': '#5F8A70',
        'semantic-green-text': '#6F9E82',
        'semantic-green-soft': 'rgba(95, 138, 112, 0.14)',
        'semantic-rose': '#A85F68',
        'semantic-rose-text': '#B96E78',
        'semantic-rose-soft': 'rgba(168, 95, 104, 0.14)',
        'semantic-amber': '#A98245',
        'semantic-amber-text': '#BE9553',
        'semantic-amber-soft': 'rgba(169, 130, 69, 0.14)',
        'semantic-blue': '#6683A3',
        'semantic-blue-text': '#7796B8',
        'semantic-blue-soft': 'rgba(102, 131, 163, 0.14)',
      },
    },
  },
  plugins: [],
}
