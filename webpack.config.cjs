const defaults = require('@wordpress/scripts/config/webpack.config');
const path = require('node:path');
module.exports = {
  ...defaults,
  entry: {
    builder: path.resolve(__dirname, 'assets/src/builder/index.tsx'),
    submissions: path.resolve(__dirname, 'assets/src/submissions/index.tsx'),
    blocks: path.resolve(__dirname, 'assets/src/blocks/index.ts')
  },
  output: { ...defaults.output, path: path.resolve(__dirname, 'build/admin'), library: { name: ['CFFAdmin', '[name]'], type: 'window' } }
};
