const { merge } = require('webpack-merge');
const common = require('./common.js');
const LavaMoat = require('@lavamoat/webpack')
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = merge(common, {
  devtool: false,
  mode: 'production',
  optimization: {
    // This is needed for LavaMoat to work
    runtimeChunk: 'single',
    minimize: true,
  },
  plugins: [
    new LavaMoat({
      lockdown: {
        errorTaming: 'unsafe',
        mathTaming: 'unsafe',
        dateTaming: 'unsafe',
        consoleTaming: 'unsafe',
        overrideTaming: "severe",
        localeTaming: "unsafe",
        errorTrapping: 'none',
        stackFiltering: "verbose",
      },
      policyLocation: path.resolve(
        __dirname,
        "..",
        "lavamoat"
      ),
      generatePolicy: process.env.LAVAMOAT_AUTO_POLICY === 'true',
      readableResourceIds: false,
      runChecks: false,
      diagnosticsVerbosity: 0,
      debugRuntime: false,
      scuttleGlobalThis: {
        enabled: true,
        scuttlerName: "SCUTTLER",
        exceptions: [
          "prompt",
          "history",
          "HTMLElement",
          "innerWidth",
          "innerHeight",
          "Element",
          "getComputedStyle",
          "visualViewport",
          "pageXOffset",
          "pageYOffset",
          "devicePixelRatio",
          "HTMLIFrameElement",
          "crypto",
          "getSelection",
          "Set",
          "Object",
          "Reflect",
          "Symbol",
          "JSON"
        ],
      }
    }),
  ]
});
