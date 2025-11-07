import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  minify: false,
  sourcemap: true,
  target: 'node18',
  splitting: false,
})
