/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg-color)',
        panel: 'var(--panel-bg)',
        border: 'var(--border-color)',
        textMain: 'var(--text-main)',
        textMuted: 'var(--text-muted)',
        plus: 'var(--plus-color)',
        minus: 'var(--minus-color)',
      }
    },
  },
  plugins: [],
}
