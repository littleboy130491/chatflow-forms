const js = require('@eslint/js');
const parser = require('@typescript-eslint/parser');
const typescript = require('@typescript-eslint/eslint-plugin');
const globals = require('globals');

module.exports = [
  { ignores: ['build/**', 'vendor/**', 'vendor-prefixed/**', 'node_modules/**', '**/*.generated.ts'] },
  js.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node }, ecmaVersion: 'latest', sourceType: 'module' } },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser },
    plugins: { '@typescript-eslint': typescript },
    rules: { ...typescript.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'error' }
  }
];
