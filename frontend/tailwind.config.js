/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: '#F5EDE3',
        beige: '#E8DDD0',
        caramel: '#D4BBA5',
        chocolate: '#5C4E3D',
        coffee: '#8E7A68',
        dark: '#4A3F33',
        warmBrown: '#6B4226',
        shadowLight: '#FFFFFF',
        shadowDark: '#C9BDB0',
      },
      boxShadow: {
        'flat': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'flat-md': '0 4px 6px rgba(0, 0, 0, 0.07)',
        'flat-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'flat-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'none': 'none',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
