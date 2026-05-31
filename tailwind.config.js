/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        netflix: { bg: '#141414', card: '#1f1f1f', hover: '#333', text: '#e5e5e5', muted: '#808080', accent: '#e50914', gold: '#f5c518' },
        admin: { bg: '#0a0a0a', sidebar: '#111', card: '#1a1a1a', border: '#222' },
      },
    },
  },
  plugins: [],
};
