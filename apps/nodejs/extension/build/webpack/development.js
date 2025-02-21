const { merge } = require('webpack-merge');
const common = require('./common.js');
const LavaMoat = require('@lavamoat/webpack')
const path = require('path')

const srcDir = path.join(__dirname, "..", "..", "src");

module.exports = merge(common, {
  entry: {
    proxy: path.join(srcDir, 'proxy.ts'),
    provider: path.join(srcDir, 'provider.ts'),
  },
  devtool: 'inline-source-map',
  mode: 'development',
})
