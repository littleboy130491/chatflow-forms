const defaults = require('@wordpress/scripts/config/webpack.config');
const path = require('node:path');
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
module.exports = {
  ...defaults,
  plugins: defaults.plugins.map(plugin => plugin instanceof DependencyExtractionWebpackPlugin
    ? new DependencyExtractionWebpackPlugin({
      // WordPress 6.4 exposes React, but not the automatic JSX runtime handle.
      requestToExternal: request => /^react\/jsx-(?:dev-)?runtime$/.test(request) ? false : undefined
    }) : plugin),
  entry: {
    builder: path.resolve(__dirname, 'assets/src/builder/index.tsx'),
    submissions: path.resolve(__dirname, 'assets/src/submissions/index.tsx'),
    blocks: path.resolve(__dirname, 'assets/src/blocks/index.ts')
  },
  output: { ...defaults.output, path: path.resolve(__dirname, 'build/admin'), library: { name: ['CFFAdmin', '[name]'], type: 'window' } }
};
