const path = require('path');
// HTMLを生成するプラグイン
const HtmlWebpackPlugin = require('html-webpack-plugin');
// JSで読み込んだCSSファイルを出力するプラグイン
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: 'development',
  entry: {
    app: './src/app.js',
  },
  output: {
    path: path.resolve(__dirname, './build/'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss'],
  },
  module: {
    rules: [
      {
        test: /\.(js)x?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(scss|css)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: true,
              importLoaders: 2
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          }
        ]
      },
      {
        test: /.(gif|png|jpg|eot|wof|woff|woff2|ttf|svg)$/,
        loader: 'file-loader',
        options: {
          name: './images/[name].[ext]',
        }
      }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: 'assets/main.css',
    }),
  ],
  devServer: {
    port: 3000,
    open: true,
    contentBase: path.resolve(__dirname, './public'),
    watchContentBase: true,
  },
}
