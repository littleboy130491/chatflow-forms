const wordpress = require('@wordpress/babel-preset-default');
const jsxPlugin = require.resolve('@babel/plugin-transform-react-jsx');

module.exports = {
  presets: [function wordpressClassic(api) {
    const preset = wordpress(api);
    preset.plugins = preset.plugins.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === jsxPlugin
        ? [jsxPlugin, { runtime: 'classic', pragma: 'createElement', pragmaFrag: 'Fragment' }]
        : plugin
    );
    return preset;
  }]
};
