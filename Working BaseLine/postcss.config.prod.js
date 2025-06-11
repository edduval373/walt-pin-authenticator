export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    cssnano: {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: false,
        // Prevent CSS syntax errors during minification
        reduceIdents: false,
        mergeIdents: false,
        discardUnused: false,
        // More conservative minification to prevent syntax errors
        calc: false,
        colormin: false,
        convertValues: false,
        discardDuplicates: true,
        discardEmpty: true,
        mergeRules: false,
        minifyFontValues: false,
        minifyGradients: false,
        minifyParams: false,
        minifySelectors: false,
        normalizeCharset: false,
        normalizeDisplayValues: false,
        normalizePositions: false,
        normalizeRepeatStyle: false,
        normalizeString: false,
        normalizeTimingFunctions: false,
        normalizeUnicode: false,
        normalizeUrl: false,
        orderedValues: false,
        reduceInitial: false,
        reduceTransforms: false,
        svgo: false,
        uniqueSelectors: false,
      }]
    }
  }
}