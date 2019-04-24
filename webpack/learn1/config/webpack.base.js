'use strict'
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

function resolve (src) {
  return path.resolve(__dirname, src)
}
module.exports = {
  mode: 'development',
  entry: '',
  output: {
    filename: 'index.js',
    path: resolve('../dist'),
    library: 'bundle'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: ['vue-loader']
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()                   // 15版本后
  ]
}