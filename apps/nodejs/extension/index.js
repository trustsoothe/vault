const browserify = require("browserify");
const tsify = require("tsify");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");

const files = [
  "home.tsx",
  "offscreen.ts",
  "provider.ts",
  "proxy.ts",
  "background.ts",
];

const lavamoatOpts = {
  policy: "./lavamoat/browserify/policy.json",
  override: "./lavamoat/browserify/policy-override.json",
  writeAutoPolicy: true,
  writeAutoPolicyDebug: true,
  prunePolicy: true,
  debug: true,
  scuttleGlobalThis: {
    enabled: true,
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
      "global",
      "getSelection",
    ],
    scuttlerName: "SCUTTLER",
  },
};
fs.mkdirSync(path.join("dist", "js"), { recursive: true });
fsExtra.copySync("public", "dist", { override: true });

fs.copyFileSync(
  path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "node_modules",
    "@lavamoat",
    "snow",
    "snow.prod.js"
  ),
  path.resolve(__dirname, "dist", "js", "snow.js")
);
// fs.copyFileSync(
//   path.resolve(
//     __dirname,
//     "..",
//     "..",
//     "..",
//     "node_modules",
//     "globalthis",
//     "index.js"
//   ),
//   path.resolve(__dirname, "dist", "js", "globalthis.js")
// );

for (const file of files) {
  const dest = path.join(
    ".",
    "dist",
    "js",
    file.replace("tsx", "js").replace("ts", "js")
  );

  const opts = {
    entries: [path.join(".", "src", file)],
    extensions: [".js", ".ts", ".tsx"],
    dedupe: false,
  };
  let b = browserify(opts)
    .plugin(tsify)
    .transform("babelify", {
      extensions: [".ts", ".tsx"],
      presets: ["@babel/preset-env", "@babel/preset-react"],
      plugins: ["inline-react-svg"],
      // sourceMaps: false,
      // global: true,
    });

  // lavamoat is not necessary on provider because this file do not use dependencies.
  // also this script is not isolated, so it could break things in the websites it is injected if lavamoat is applied.
  if (file !== "provider.ts") {
    b = b.plugin("lavamoat-browserify", lavamoatOpts);
  }

  b.transform("@browserify/uglifyify", {
    global: true,
  })
    .bundle()
    .pipe(fs.createWriteStream(dest));
}
