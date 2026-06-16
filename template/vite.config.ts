import path from 'node:path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import pkg from './package.json';

const resolve = (p: string) => path.resolve(__dirname, p);

const externals = new Set<string>([
  ...Object.keys(pkg.dependencies ?? {}),
  // ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {})
]);

export default defineConfig({
  plugins: [
    dts({
      entryRoot: resolve('src'),
      tsconfigPath: resolve('tsconfig.json'),
      outDirs: resolve('dist')
    })
  ],
  build: {
    target: 'esnext',
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    lib: {
      entry: resolve('src/index.ts'),
      name: 'jshow-nest-{NAME}',
      formats: ['es', 'cjs'],
      fileName: fmt => `index.${fmt === 'es' ? 'mjs' : 'cjs'}`
    },
    rolldownOptions: {
      external: [/^node:/, ...Array.from(externals)]
    }
  }
});
