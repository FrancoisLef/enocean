import { defineConfig } from 'tsup';

export default defineConfig([
  // CLI binary
  {
    entry: ['src/bin.ts'],
    format: ['cjs'],
    target: 'node18',
    clean: true,
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
