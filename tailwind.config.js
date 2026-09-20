/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // --- Root & Surface Scale ---
        'bg-primary': 'rgb(var(--bg-primary-rgb) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--bg-secondary-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-dim': 'rgb(var(--surface-dim-rgb) / <alpha-value>)',
        'surface-bright': 'rgb(var(--surface-bright-rgb) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--surface-container-lowest-rgb) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--surface-container-low-rgb) / <alpha-value>)',
        'surface-container': 'rgb(var(--surface-container-rgb) / <alpha-value>)',
        'surface-container-high': 'rgb(var(--surface-container-high-rgb) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--surface-container-highest-rgb) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated-rgb) / <alpha-value>)',
        'surface-modal': 'rgb(var(--surface-modal-rgb) / <alpha-value>)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        'inverse-surface': 'var(--inverse-surface)',
        'inverse-on-surface': 'var(--inverse-on-surface)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        'surface-tint': 'var(--surface-tint)',

        // --- Brand & Interactive Gold Scale ---
        primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
        'on-primary': 'var(--on-primary)',
        'primary-container': 'var(--primary-container)',
        'on-primary-container': 'var(--on-primary-container)',
        'primary-hover': 'var(--primary-hover)',
        'primary-focus': 'var(--primary-focus)',
        'primary-soft': 'var(--primary-soft)',
        'primary-50': 'var(--primary-50)',
        'primary-100': 'var(--primary-100)',
        'primary-500': 'rgb(var(--primary-rgb) / <alpha-value>)',
        'primary-600': 'var(--primary-600)',
        'primary-700': 'var(--primary-700)',
        'primary-900': 'var(--primary-900)',
        'primary-950': 'var(--primary-950)',

        // --- Typography Scale ---
        'text-primary': 'rgb(var(--text-primary-rgb) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        'text-disabled': 'var(--text-disabled)',
        'text-gold': 'rgb(var(--text-gold-rgb) / <alpha-value>)',

        // --- Borders & Dividers ---
        'border-default': 'var(--border-default)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'border-gold': 'rgb(var(--border-gold-rgb) / <alpha-value>)',
        'border-gold-focus': 'var(--border-gold-focus)',

        // --- Muted Semantic Scale ---
        'semantic-green': 'rgb(var(--semantic-green-rgb) / <alpha-value>)',
        'semantic-green-text': 'var(--semantic-green-text)',
        'semantic-green-soft': 'var(--semantic-green-soft)',
        'semantic-rose': 'rgb(var(--semantic-rose-rgb) / <alpha-value>)',
        'semantic-rose-text': 'var(--semantic-rose-text)',
        'semantic-rose-soft': 'var(--semantic-rose-soft)',
        'semantic-amber': 'rgb(var(--semantic-amber-rgb) / <alpha-value>)',
        'semantic-amber-text': 'var(--semantic-amber-text)',
        'semantic-amber-soft': 'var(--semantic-amber-soft)',
        'semantic-blue': 'rgb(var(--semantic-blue-rgb) / <alpha-value>)',
        'semantic-blue-text': 'var(--semantic-blue-text)',
        'semantic-blue-soft': 'var(--semantic-blue-soft)',
      },
    },
  },
  plugins: [],
}
