const path = require('path')
const webpack = require('webpack')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const TerserPlugin = require('terser-webpack-plugin')

const workboxPlugin = require('workbox-webpack-plugin')

module.exports = {
  mode: 'development',

  entry: {
    main: './src/index.js',
  },

  output: {
    filename: 'graphs.js',
    path: path.resolve(__dirname, '..', 'widgets', 'dist'),
    // path: path.resolve(__dirname, 'dist'),
    library: 'graphs',
    libraryTarget: 'umd',
    // globalObject: 'this',
    // libraryExport: 'default'
  },

  externals: {
    jquery: {
      commonjs: 'jquery',
      commonjs2: 'jquery',
      amd: 'jquery',
      var: '$',
    },
    // lodash: {
    //   commonjs: 'lodash',
    //   commonjs2: 'lodash',
    // 	amd: 'lodash',
    //   root: '_' // indicates global variable
    // },
    // numeral: {
    //   commonjs: 'numeral',
    //   commonjs2: 'numeral',
    // 	amd: 'numeral',
    //   var: '_n' // indicates global variable
    // },
  },

  plugins: [
    new webpack.ProgressPlugin(),
    // new MiniCssExtractPlugin({ filename: 'graphs.css' }),
    new MiniCssExtractPlugin({ filename: 'assets/css/graphs.css' }),
    // new workboxPlugin.GenerateSW({
    //   swDest: 'sw.js',
    //   clientsClaim: true,
    //   skipWaiting: false,
    // }),
  ],

  module: {
    rules: [
      {
        test: /.(js|jsx)$/,
        include: [],
        loader: 'babel-loader',
      },
      {
        test: /.(scss|css)$/,

        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',

            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',

            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      }
    ],
  },

  optimization: {
    minimizer: [new TerserPlugin()],

    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/,
        },
      },

      chunks: 'async',
      minChunks: 1,
      minSize: 30000,
      name: true,
    },
  },
}
