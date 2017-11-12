import buble from 'rollup-plugin-buble'
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'index.js'
, dest: 'ripple.js'
, format: 'iife'
, moduleName: 'rijs'
, plugins: [
    nodeResolve({ browser: true })
  , commonjs({
      ignoreGlobal: true
    })
  , buble()
  ]
}