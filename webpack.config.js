'use strict';

const webpack = require('webpack')
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  devtool: 'source-map',

  target: 'web',

  entry : './src/index.js',

  output: {
    path         : path.resolve(__dirname, 'dist'),
    filename     : isProd ? 'backendless-rt-client.min.js' : 'backendless-rt-client.js',
    library      : 'BackendlessRTClient',
    libraryTarget: 'umd'
  },

  module: {
    noParse: /backendless-request/,

    rules: [
      {
        test   : /\.js$/,
        exclude: /node_modules/,
        loader : 'babel-loader'
      }
    ]
  },

  optimization: {
    minimize : isProd,
    minimizer: [new TerserPlugin({
      parallel     : true,
      terserOptions: {
        ecma: 6,
      },
    })],
  },

  plugins: [
    new webpack.NormalModuleReplacementPlugin(/socket\.io-parser/, __dirname + '/src/socket-parser')
  ]
}

