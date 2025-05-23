import fs from 'fs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const isProd = process.env.NODE_ENV === 'production';

export default {
  input: pkg.module,
  plugins: [
    babel({
      babelHelpers: 'bundled',
      presets: [ '@babel/preset-env' ]
    }),
    isProd ? terser({ maxWorkers: 4 }) : null
  ],
  output: {
    file: pkg.main,
    format: 'cjs',
    sourcemap: 'inline'
  }
};
