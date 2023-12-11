const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: {
    home: path.join(srcDir, "home.tsx"),
    background: path.join(srcDir, "background.ts"),
    offscreen: path.join(srcDir, "offscreen.ts"),
    proxy: path.join(srcDir, "proxy.ts"),
    provider: path.join(srcDir, "provider.ts"),
  },
  output: {
    path: path.join(__dirname, "../dist/js"),
    filename: "[name].js",
  },
  optimization: {
    splitChunks: {
      name: "vendor",
      chunks(chunk) {
        return chunk.name !== "background" && chunk.name !== "provider";
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      buffer: require.resolve("buffer/"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify/browser"),
      https: require.resolve("https-browserify"),
      http: require.resolve("stream-http"),
      zlib: require.resolve("browserify-zlib"),
      url: require.resolve("url/"),
      assert: require.resolve("assert/"),
      tls: require.resolve("tls-browserify"),
      querystring: require.resolve("querystring-es3/"),
      "process/browser": require.resolve("process/browser"),
      fs: false,
      net: false,
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: ".",
          to: "../",
          context: "public",
          priority: 0,
          filter: (resourcePath) => !resourcePath.includes("vendor"),
        },
        {
          from: "public/manifest-w.json",
          to: "../manifest.json",
          force: true,
          priority: 1,
        },
      ],
      options: {},
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, "");
    }),
    new Dotenv(),
  ],
};
