import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    'index': 'lib/index.ts',
    'xlsx/index': 'lib/xlsx/index.ts'
  },
  format: [ 'esm', 'cjs' ],
  fixedExtension: false,
  target: 'es2022',
  sourcemap: true,
  clean: true,
  dts: true
});
