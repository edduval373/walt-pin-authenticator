export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    cssnano: process.env.NODE_ENV === 'production' ? {
      preset: ['lite', {
        discardComments: {
          removeAll: true,
        },
        // Use the most conservative "lite" preset to prevent syntax errors
        normalizeWhitespace: true,
      }]
    } : false,
  },
}
