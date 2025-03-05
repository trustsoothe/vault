// this is to load the envs so the checkEnvs function works
require('dotenv').config()
const webpack = require("webpack");
const path = require("path");
const Dotenv = require("dotenv-webpack");
const CopyPlugin = require("copy-webpack-plugin");
const getManifest = require("../manifest");

// Its immediate because we only need to run it once.
(function checkEnvs() {
  const requiredEnvs = [
    'WPOKT_MAINNET_API_BASE_URL',
    'PRICE_API_BASE_URL',
    'NETWORKS_CDN_URL',
    'ASSETS_CDN_URL'
  ]

  for (const env of requiredEnvs) {
    if (!process.env[env]) {
      throw new Error(`Missing required env: ${env}`)
    }
  }
})()

const srcDir = path.join(__dirname, "..", "..", "src");
const distDir = path.join(__dirname, "..", "..", "dist");
const jsDistDir = path.join(distDir, "js");

const isFirefox = process.env.BROWSER === "Firefox";
const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  entry: {
    home: path.join(srcDir, "home.tsx"),
    background: path.join(srcDir, "background.ts"),
  },
  output: {
    path: jsDistDir,
    filename: "[name].js",
    clean: true,
  },
  optimization: {
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
            // proxy and provider are only bundled with this config in development
            // and we want single files for those entry points
            return !["proxy", "provider"].includes(chunk.name)
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
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              tsconfigRaw: require('../../tsconfig.json')
            },
          },
        ],
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
    new CopyPlugin({
      patterns: [
        {
          from: ".",
          to: path.join(".."),
          context: "public",
          priority: 0,
        },
        {
          from: ".",
          to: path.join("..","manifest.json"),
          priority: 1,
          transform: {
            transformer: () => {
              return getManifest(isFirefox);
            },
          },
        },
        {
          from: path.join(
            __dirname,
            "..",
            "..",
            "resources",
            isFirefox ? "background.html" : `${isDev ? 'dev' : 'prod'}-background-loader.js`
          ),
          to: isFirefox ? path.join('..','background.html') : 'background-loader.js',
        },
        // We don't need to copy the snow.js file in development
        ...(isDev ? [] : [
          // This is required to apply scuttling mode in every realm (window, iframe, worker, etc)
          {
            from: require.resolve('@lavamoat/snow/snow.prod.js'),
            to: 'snow.js',
          },
        ]),
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
