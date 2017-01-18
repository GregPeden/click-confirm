var path = require('path')
var config = require('./base');
var webpack = require('webpack')

module.exports = Object.assign({}, config, {
  entry: './src/ClickConfirm.vue',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'click-confirm.min.js',
    library: ['click-confirm'],
    libraryTarget: 'umd',
  },
  devtool: '#source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false,
      mangle: {
        screw_ie8: true,
        keep_fnames: true
      },
      compress: {
        screw_ie8: true,
        warnings: false
      },
      comments: false
    }),
    new webpack.optimize.OccurenceOrderPlugin()
  ]
});