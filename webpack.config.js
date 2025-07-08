const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack'); // Add this line

module.exports = {
  entry: './src/renderer/index.jsx',
  output: {
    path: path.resolve(__dirname, 'src/renderer/dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    // Add this plugin
    new webpack.ProvidePlugin({
      global: 'global',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'src/renderer/dist'),
    },
    port: 3000,
    hot: true,
  },
  target: 'electron-renderer',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};