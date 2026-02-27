'use strict'

const webpack = require('webpack')
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const pkg = require('./package.json')

const isProd = process.env.NODE_ENV === 'production'

const banner = `********************************************************************************************************************
 *  Backendless RT Client for JavaScript. Version: ${ pkg.version }
 *
 *  Copyright 2012-${ new Date().getFullYear() } BACKENDLESS.COM. All Rights Reserved.
 *
 *  NOTICE: All information contained herein is, and remains the property of Backendless.com and its suppliers,
 *  if any. The intellectual and technical concepts contained herein are proprietary to Backendless.com and its
 *  suppliers and may be covered by U.S. and Foreign Patents, patents in process, and are protected by trade secret
 *  or copyright law. Dissemination of this information or reproduction of this material is strictly forbidden
 *  unless prior written permission is obtained from Backendless.com.
 * ********************************************************************************************************************`

module.exports = {
  devtool: 'source-map',

  target: 'web',

  entry: './src/index.js',

  output: {
    path         : path.resolve(__dirname, 'dist'),
    filename     : isProd ? 'backendless-rt-client.min.js' : 'backendless-rt-client.js',
    library      : 'BackendlessRTClient',
    libraryTarget: 'umd',
  },

  module: {
    noParse: /backendless-request/,

    rules: [
      {
        test   : /\.js$/,
        exclude: /node_modules/,
        loader : 'babel-loader',
      },
    ],
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
    new webpack.NormalModuleReplacementPlugin(/socket\.io-parser/, __dirname + '/src/socket-parser'),
    new webpack.BannerPlugin({ banner }),
  ],
}

