const path = require('path');
   const HtmlWebpackPlugin = require('html-webpack-plugin');
   const webpack = require('webpack');

   module.exports = {
     entry: './src/index.js',
     output: {
       path: path.resolve(__dirname, 'dist'),
       filename: 'bundle.js',
       publicPath: '/',
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
           test: /\.css$/,
           use: ['style-loader', 'css-loader', 'postcss-loader'],
         },
       ],
     },
     resolve: {
       extensions: ['.js', '.jsx'],
       fallback: {
         "path": require.resolve("path-browserify"),
         "vm": require.resolve("vm-browserify"),
         "url": require.resolve("url/"),
         "zlib": require.resolve("browserify-zlib"),
         "https": require.resolve("https-browserify"),
         "http": require.resolve("stream-http"),
         "crypto": require.resolve("crypto-browserify"),
         "stream": require.resolve("stream-browserify"),
         "assert": require.resolve("assert/"),
         "os": require.resolve("os-browserify/browser"),
         "process": require.resolve("process/browser"),
       },
       alias: {
         'process/browser': require.resolve('process/browser'),
       },
     },
     plugins: [
       new HtmlWebpackPlugin({
         template: './public/index.html',
       }),
       new webpack.ProvidePlugin({
         process: 'process/browser',
       }),
       new webpack.DefinePlugin({
         'process.env': JSON.stringify(process.env)
       }),
     ],
     devServer: {
       historyApiFallback: true,
       static: {
         directory: path.join(__dirname, 'public'),
       },
       port: 3000,
       hot: true,
     },
};