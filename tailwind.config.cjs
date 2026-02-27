/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'moss-green': '#6F7B52',
        'char-brown': '#4A2F1C',
        'deep-terracotta': '#A86539',
        'warm-copper': '#D0804B',
        'olive-green': '#8D9158',
        'clay-cream': '#F2E6C8',
       
        
      },
    },
  },
  plugins: [],
};
