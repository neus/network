import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [path.join(here, 'index.html'), path.join(here, 'src/**/*.{js,jsx,ts,tsx}')],
  theme: {
    extend: {
      fontFamily: {
        display: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif'
        ],
        body: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif'
        ]
      },
      boxShadow: {
        card: '0 10px 28px rgba(0,0,0,0.28), 0 1px 0 rgba(90,90,90,0.12), inset 0 1px 0 rgba(90,90,90,0.1)',
        'card-h': '0 16px 36px rgba(0,0,0,0.36), 0 0 0 1px rgba(90,90,90,0.14)',
        'glow-primary': '0 0 20px rgba(152, 192, 239, 0.35)',
        'glow-primary-sm': '0 0 15px rgba(152, 192, 239, 0.4)'
      },
      colors: {
        bg: 'var(--neus-bg-base)',
        surface: 'var(--neus-bg-rail)',
        'surface-elevated': 'var(--neus-bg-elevated)',
        primary: {
          DEFAULT: 'rgb(152, 192, 239)',
          dim: 'rgb(61, 114, 201)',
          dark: 'rgb(47, 80, 151)'
        },
        on: { primary: 'var(--neus-on-accent)' },
        text: {
          p: 'var(--neus-text-primary)',
          s: 'var(--neus-text-secondary)',
          m: 'var(--neus-text-muted)'
        },
        tertiary: 'rgb(120, 130, 150)',
        success: 'rgb(34, 197, 94)',
        'glass-border': 'rgba(90, 90, 90, 0.18)',
        'glass-05': 'rgba(255, 255, 255, 0.05)',
        'glass-10': 'rgba(255, 255, 255, 0.1)',
        'glass-02': 'rgba(255, 255, 255, 0.02)',
        'glass-04': 'rgba(255, 255, 255, 0.04)',
        'primary-glow': 'rgba(152, 192, 239, 0.05)',
        'primary-b': 'rgba(152, 192, 239, 0.2)',
        'primary-10': 'rgba(152, 192, 239, 0.1)',
        'primary-40': 'rgba(152, 192, 239, 0.4)'
      }
    }
  },
  plugins: []
};
