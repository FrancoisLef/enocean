import { defineConfig } from 'tsup';

export default defineConfig([
  // Library bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    target: 'node18',
    clean: true,
    dts: true,
    minify: false,
    splitting: false,
    treeshake: true,
    bundle: true,
    platform: 'node',
    external: ['serialport'],
  },
  // CLI binary
  {
    entry: ['src/bin.ts'],
    format: ['cjs'],
    target: 'node18',
    clean: false,
    dts: false,
    minify: false,
    splitting: false,
    treeshake: true,
    bundle: true,
    platform: 'node',
    external: ['serialport'],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
