import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM + CJS for bundlers / Node
  {
    entry: { flowtour: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    target: 'es2019',
  },
  // Single global <script> build for plain HTML pages, e.g. <script src=".../flowtour.global.js">
  {
    entry: { flowtour: 'src/index.ts' },
    format: ['iife'],
    globalName: 'FlowTour',
    outExtension: () => ({ js: '.global.js' }),
    dts: false,
    sourcemap: true,
    minify: true,
    target: 'es2019',
  },
]);
