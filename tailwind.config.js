/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fe4e51',
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#ffc5c6',
          300: '#ff9a9b',
          400: '#ff6264',
          500: '#fe4e51',
          600: '#eb2022',
          700: '#c61519',
          800: '#a31518',
          900: '#87191b',
          950: '#490809'
        },
        dark: {
          DEFAULT: '#343433',
          50: '#4a4a49',
          100: '#434342',
          200: '#3c3c3b',
          300: '#343433',
          400: '#2c2c2b',
          500: '#252524',
          600: '#1e1e1d',
          700: '#171716',
          800: '#101010',
          900: '#0a0a09'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
