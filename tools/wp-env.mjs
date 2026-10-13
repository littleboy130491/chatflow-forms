import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const git = require('simple-git');
// wp-env expects the pre-v4 callable export; retain the security-patched v4 API.
if (typeof git !== 'function') {
  require.cache[require.resolve('simple-git')].exports = Object.assign(git.simpleGit, git);
}
const args = process.argv.slice(2);
require('@wordpress/env/lib/cli.js')().parse(args.length ? args : ['--help']);
