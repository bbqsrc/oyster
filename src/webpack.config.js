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
        loaders: ['babel']
      }
    ]
  },
  externals: {
    //'react': 'React',
    'jquery': 'jQuery',
    'ace': 'ace',
    'toml': 'toml',
    'moment': 'moment',
    'mongoose': 'mongoose'
  },
  output: {
    library: 'Oyster',
    path: path.resolve(__dirname, '../assets/static/js'),
    filename: '[name].min.js'
  }
};
