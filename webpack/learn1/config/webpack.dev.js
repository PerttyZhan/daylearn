'use strict'
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
// const CleanWebpackPlugin = require('clean-webpack-plugin')
// const webpack = require('webpack')

function resolve (src) {
  return path.resolve(__dirname, src)
}

module.exports = {
  mode: 'development',
  entry: {
    'component1/index': resolve('../src/out-component/component1/index.vue'),
    'component2/index': resolve('../src/out-component/component2/index.vue')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
    library: 'bundle'
  },
  devServer: {
    contentBase: resolve('../dist'),
    host: 'localhost',
    compress: true,
    port: 8888,
    // hot: true
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
    new VueLoaderPlugin(),                   // 15版本后
    new HtmlWebpackPlugin({
      template: 'index.html',
      filename: 'index.html'
    }),
    // new CleanWebpackPlugin(),
    // new webpack.NamedModulesPlugin(),
    // new webpack.HotModuleReplacementPlugin()
  ],
  resolve: {
    extensions: ['.js', '.vue', '.json']
  }
}