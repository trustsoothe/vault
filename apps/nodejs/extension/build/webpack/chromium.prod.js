const webpack = require("webpack");
const path = require("path");
const Dotenv = require("dotenv-webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const srcDir = path.join(__dirname, "..", "..", "src");
const distDir = path.join(__dirname, "..", "..", "dist");
const jsDistDir = path.join(distDir, "js");

module.exports = {
  mode: "production",
  entry: {
    proxy: path.join(srcDir, "proxy.ts"),
    provider: path.join(srcDir, "provider.ts"),
  },
  output: {
    path: jsDistDir,
    filename: "[name].js",
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
    new BundleAnalyzerPlugin({
      analyzerMode: "static", // Generates a static HTML file for analysis
      reportFilename: "bundle-report.html", // The name of the generated report file
      openAnalyzer: false, // Automatically opens the report in the browser
      generateStatsFile: true, // Generate stats.json file for further analysis
      defaultSizes: "parsed",
      statsFilename: "bundle-stats.json", // Name of the JSON stats file
      statsOptions: null, // Pass customized stats options (optional)
      excludeAssets: null, // Filter out specific assets (optional, use patterns if required)
      logLevel: "info", // Adjust logging level (e.g., "info", "warn")
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
