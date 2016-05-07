import 'babel-polyfill';
import path from 'path';
import webpack from 'webpack';
import fs from 'fs';

const nodeModules = {};
fs.readdirSync('node_modules')
  .filter((x) => {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach((mod) => {
    nodeModules[mod] = 'commonjs ' + mod;
  });

const DEBUG = !process.argv.includes('--release');
const VERBOSE = process.argv.includes('--verbose');

export default {
  entry: './server.js',

  output: {
    path: path.join(__dirname, 'public'),
    filename: 'server-bundle.js',
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': `"${process.env.NODE_ENV || (DEBUG ? 'development' : 'production')}"` }),
    ...(DEBUG ? [] : [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({ compress: { screw_ie8: true, warnings: VERBOSE } }),
      new webpack.optimize.AggressiveMergingPlugin(),
    ]),
  ],

  target: 'node',

  resolve: {
    extensions: ['', '.js', '.json'],
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel' },
      { test: /\.json$/, loader: 'json' },
    ],
  },

  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    module: 'empty',
    child_process: 'empty',
  },

  externals: nodeModules
};
