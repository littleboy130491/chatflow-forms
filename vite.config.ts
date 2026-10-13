import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig(() => {
  const tracking = process.env.CFF_ENTRY === 'tracking';
  return {
  esbuild: { jsx: 'automatic', jsxImportSource: 'preact' },
  build: {
    target: 'es2020', outDir: 'build/runtime', emptyOutDir: !tracking, sourcemap: false,
    lib: { entry: resolve(tracking ? 'assets/src/tracking/index.ts' : 'assets/src/runtime/index.tsx'), formats: ['es'], fileName: () => tracking ? 'tracking.js' : 'runtime.js' },
    rollupOptions: { output: { inlineDynamicImports: true, assetFileNames: '[name][extname]' } }
  }
  };
});
