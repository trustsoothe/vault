const path = require('path')
const { merge } = require('webpack-merge');
const LavaMoat = require('@lavamoat/webpack')
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const common = require('./common.js');

const plugins = [
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

if (process.env.ANALYZE_BUNDLE === 'true') {
  plugins.push(
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
  )
}

module.exports = merge(common, {
  devtool: false,
  mode: 'production',
  optimization: {
    // This is needed for LavaMoat to work
    runtimeChunk: 'single',
    minimize: true,
  },
  plugins,
});
