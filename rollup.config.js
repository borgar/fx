import babel from '@rollup/plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import pkg from './package.json';

const isProd = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  plugins: [
    babel({
      babelHelpers: 'bundled',
      presets: [ '@babel/preset-env' ]
    })
  ],
  output: {
    file: pkg.main,
    format: 'cjs',
    sourcemap: 'inline',
    plugins: [
      isProd && uglify()
    ]
  }
};
