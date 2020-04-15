'use strict';

const webpack = require('webpack')

const isProd = process.env.NODE_ENV === 'production'

const plugins = [
  new webpack.NormalModuleReplacementPlugin(/socket\.io-parser/, __dirname + '/src/socket-parser')
];

if (isProd) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compressor: {
      pure_getters: true,
      unsafe      : true,
      unsafe_comps: true,
      warnings    : false,
      screw_ie8   : false
    },
    mangle    : {
      screw_ie8: false
    },
    output    : {
      screw_ie8: false
    },
    sourceMap : true
  }))
}

module.exports = {
  devtool: 'source-map',

  target: 'web',

  node: {
    Buffer: false
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

  output: {
    library      : 'BackendlessRTClient',
    libraryTarget: 'umd'
  },

  plugins
}

