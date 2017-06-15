const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: [
    './test/app.js',
  ],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].bundle.js',
    publicPath: '/',                          // New
  },
  devServer: {
    contentBase: path.resolve(__dirname, './test'),  // New
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader'
        }],
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 0,
              modules: true,
              localIdentName: "_[local]-[hash:base64:5]"
            }
          },
          {
            loader: "postcss-loader"
          }
        ]
      }
      // {
      //   test: /\.sketch$/,
      //   use: [
      //     "url-loader",
      //   ]
      // }
    ],
  },
};