import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
  build: {
    target: 'es2020', outDir: 'build/runtime', emptyOutDir: true, sourcemap: false,
    lib: { entry: { runtime: resolve('assets/src/runtime/index.tsx'), tracking: resolve('assets/src/tracking/index.ts') }, formats: ['es'], fileName: (_format, name) => `${name}.js` },
    rollupOptions: { output: { assetFileNames: '[name][extname]' } }
  }
});
