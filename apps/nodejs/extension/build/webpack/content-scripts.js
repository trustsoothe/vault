const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");
const LavaMoat = require('@lavamoat/webpack')

const isFirefox = process.env.BROWSER === "Firefox";

const srcDir = path.join(__dirname, "..", "..", "src");
const distDir = path.join(__dirname, "..", "..", "dist", isFirefox ? "firefox" : "chromium");
const jsDistDir = path.join(distDir, "js");

module.exports = {
  mode: 'production',
  entry: {
    proxy: path.join(srcDir, "proxy.ts"),
    provider: path.join(srcDir, "provider.ts"),
  },
  output: {
    path: jsDistDir,
    filename: "[name].js",
  },
  devtool: false,
  optimization: {
    minimize: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'ts',
              tsconfigRaw: require('../../tsconfig.json')
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts",],
    fallback: {
      "process/browser": require.resolve("process/browser"),
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ]
}
