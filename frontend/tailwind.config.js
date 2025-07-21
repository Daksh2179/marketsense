export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          text: 'var(--color-sidebar-text)',
          hover: 'var(--color-sidebar-hover)',
          active: 'var(--color-sidebar-active)',
        },
        main: {
          bg: 'var(--color-main-bg)',
          text: 'var(--color-main-text)',
          header: 'var(--color-main-header)',
        },
        card: {
          bg: 'var(--color-card-bg)',
          border: 'var(--color-card-border)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
        },
        positive: 'var(--color-positive)',
        negative: 'var(--color-negative)',
      },
      transitionDuration: {
        'fast': 'var(--animation-timing-fast)',
        'medium': 'var(--animation-timing-medium)',
        'slow': 'var(--animation-timing-slow)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}