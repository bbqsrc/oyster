const path = require('path');

module.exports = {
  entry: {
    components: path.resolve(__dirname, 'index')
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel?stage=1'],
        include: __dirname
      }
    ]
  },
  output: {
    library: 'Oyster',
    path: path.resolve(__dirname, '../assets/static/js'),
    filename: '[name].min.js'
  }
};
