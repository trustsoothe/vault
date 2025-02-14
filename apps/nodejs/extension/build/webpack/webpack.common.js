const webpack = require("webpack");
const path = require("path");
const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const getManifest = require("../manifest");

const srcDir = path.join(__dirname, "..", "..", "src");
const distDir = path.join(__dirname, "..", "..", "dist");
const jsDistDir = path.join(distDir, "js");

const isFirefox = process.env.BROWSER === "Firefox";

module.exports = {
  entry: {
    home: path.join(srcDir, "home.tsx"),
    background: path.join(srcDir, "background.ts"),
    proxy: path.join(srcDir, "proxy.ts"),
    provider: path.join(srcDir, "provider.ts"),
  },
  output: {
    path: jsDistDir,
    filename: "[name].js",
    clean: true,
  },
  optimization: {
    minimize: true, // Enable minification for production
    minimizer: [
      new TerserPlugin({
        parallel: true, // Use multi-process parallel running to improve build speed
        terserOptions: {
          compress: {
            ecma: 2015, // Support newer ECMAScript syntax for better compression
            drop_console: true, // Remove console logs
            drop_debugger: true, // Remove debugger statements
            pure_funcs: ["console.info", "console.debug"], // Remove specific function calls
            passes: 3, // Perform multiple passes for better compression
          },
          mangle: {
            properties: false, // Mangle variable names (can be more aggressive if true)
          },
          format: {
            comments: false, // Remove all comments
            beautify: false, // Keep output minified
          },
          ecma: 5, // Target ECMAScript 5 for browser compatibility
          keep_classnames: false, // Remove class names (set true if debugging is required)
          keep_fnames: false, // Remove function names (set true if debugging is required)
          toplevel: true, // Optimize top-level variable and function scopes
          module: true, // Optimize ES modules
        },
        extractComments: false, // Prevent generating a separate LICENSE.txt file
      }),
    ],
    splitChunks: {
      cacheGroups: {
        reactPasswordStrength: {
          test: /[\\/]node_modules[\\/]react-password-strength-bar[\\/]/,
          name: "react-password-strength",
          chunks: "all",
        },
        mui: {
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          name: "mui",
          chunks: "all",
        },
        libsodium: {
          test: /[\\/]node_modules[\\/]libsodium-sumo[\\/]/,
          name: "libsodium-sumo",
          chunks: "all",
        },
        cosmjs: {
          test: /[\\/]node_modules[\\/]@?cosmjs.*[\\/]/,
          name: "cosmjs",
          chunks: "all",
        },
        vendor: {
          name: "vendor",
          chunks(chunk) {
            return chunk.name !== "provider";
          },
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
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
    alias: {
      lodash: "lodash-es"
    },
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
    new CopyPlugin({
      patterns: [
        {
          from: ".",
          to: "../",
          context: "public",
          priority: 0,
          filter: (resourcePath) => {
            if (resourcePath.includes("vendor")) {
              return false;
            }

            return true;
          },
        },
        {
          from: ".",
          to: "../manifest.json",
          priority: 1,
          transform: {
            transformer: () => {
              return getManifest(isFirefox, false);
            },
          },
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
