import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#EFF2F6',
        'paper-raised': '#FFFFFF',
        ink: '#16213E',
        'ink-soft': '#42506B',
        rule: '#C9D2DE',
        'rule-strong': '#9AA8BC',
        accent: {
          DEFAULT: '#D8A438',
          ink: '#4A3410',
        },
        supported: '#3E8E63',
        partial: '#C98A2E',
        contradicted: '#B85C38',
        unverifiable: '#6B7A8F',
        danger: '#B0362A',
        focus: '#2B5FB8',
      },
      fontFamily: {
        serif: ['var(--font-ibm-plex-serif)', 'serif'],
        sans: ['var(--font-ibm-plex-sans)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
