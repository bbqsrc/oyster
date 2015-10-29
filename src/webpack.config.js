const path = require('path');

const webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: {
    components: "./index",
    vendor: ['jquery', 'brace', 'moment', 'mongoose', 'toml', 'bootstrap']
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
//  devtool: "source-map",
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel?stage=1'],
        include: __dirname
      },
      // FIXME: Shouldn't need to do expose-loader shenanigans
      {
        test: require.resolve("react"),
        loader: "expose?React"
      },
      {
        test: require.resolve("jquery"),
        loader: "expose?$"
      }
    ]
  },
  output: {
    library: 'Oyster',
    path: path.resolve(__dirname, '../assets/static/js'),
    filename: '[name].min.js'
  },
  plugins: [
    new webpack.IgnorePlugin(/^mongoose$/),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.min.js",
      minChunks: Infinity
    })
  ]
};
