var path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'components/index'),
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
    'react': 'React',
    'jquery': '$',
    'ace': 'ace',
    'toml': 'toml'
  },
  output: {
    library: 'Oyster',
    path: path.resolve(__dirname, '../assets/static/js'),
    filename: 'components.min.js'
  }
};
