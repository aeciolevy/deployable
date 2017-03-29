const path = require('path');

module.exports = {
  devtool: 'cheap-module-source-map',
  entry: path.resolve(__dirname, 'src/index.jsx'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.scss$/,
      include: [path.resolve(__dirname, 'styles')],
      use: [{loader: 'style-loader'}, {loader: 'css-loader'}, {loader: 'sass-loader'}]
    }, {
      test: /\.jsx$/,
      loader: 'babel-loader',
      include: [path.resolve(__dirname, 'src')]
    }]
  }
};
