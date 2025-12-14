/**
 * PostCSS configuration for Next.js + Tailwind.
 * Tailwind v4 still works via the PostCSS plugin; we explicitly include autoprefixer for browserslist support.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
