const browserify = require("browserify");
const tsify = require("tsify");
const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");
const getManifest = require("../manifest");

const isFirefox = process.env.BROWSER === "Firefox";

// entry files
const files = ["home.tsx", "provider.ts", "proxy.ts", "background.ts"];

// create dist folder
fs.mkdirSync(path.join("dist", "js"), { recursive: true });
// copy contents from public to dist
fsExtra.copySync("public", "dist", {
  override: true,
});

// write manifest
fs.writeFileSync(
  path.join("dist", "manifest.json"),
  getManifest(isFirefox, true),
  { encoding: "utf8", flag: "w" }
);

// copy contents from snow to dist
const snowFilePath = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "node_modules",
  "@lavamoat",
  "snow",
  "snow.prod.js"
);
const snowOutputPath = path.resolve(
  __dirname,
  "..",
  "..",
  "dist",
  "js",
  "snow.js"
);

fs.copyFileSync(snowFilePath, snowOutputPath);

// THIS IS REQUIRED BECAUSE WE NEED TO INSERT THE SCUTLER IF NOT PRESENTED INSTEAD OF RETURN AN ERROR (IN SERVICE WORKER WE ARE NOT ALLOWED TO DO THIS)
// AND BECAUSE WE NEED TO ADD CUSTOM OPTIONS TO LOCKDOWN
const editedLavamoatPath = path.resolve(
  __dirname,
  "..",
  "..",
  "resources",
  "lavamoat_runtime.js"
);
const editedLavamaoutOutputPath = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "node_modules",
  "@lavamoat",
  "lavapack",
  "src",
  "runtime.js"
);
fs.copyFileSync(editedLavamoatPath, editedLavamaoutOutputPath);

// for to create the bundle for each entry file
for (const file of files) {
  const fileWithoutExt = file.substring(0, file.indexOf("."));

  const dest = path.join(".", "dist", "js", `${fileWithoutExt}.js`);

  const opts = {
    entries: [path.join(".", "src", file)],
    extensions: [".js", ".ts", ".tsx", ".cjs"],
    dedupe: false,
  };

  const web3ValidatorPath = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "node_modules",
    "web3-validator",
    "lib",
    "commonjs",
    "index.js"
  );
  let b = browserify(opts)
    // this is required because if browserify imports from web3-validator.min.js then web3-validator will be undefined
    .require(web3ValidatorPath, { expose: "web3-validator" })
    .plugin(tsify)
    .transform("babelify", {
      extensions: [".ts", ".tsx", ".js", ".cjs", ".svg"],
      presets: ["@babel/preset-env", "@babel/preset-react"],
      plugins: ["inline-react-svg", "inline-dotenv"],
      global: true,
      ignore: [
        // files need parsing
        /\/node_modules\/(?!@reduxjs\/toolkit\/dist\/query\/cjs\/rtk-query)(?!isomorphic-ws\/browser\.js)(?!webextension-polyfill)(?!random-words)/,
      ],
    });

  // cannot apply lavamoat to provider.ts because this script is not isolated, so it will break things in the websites it will be injected if lavamoat is applied.
  if (file !== "provider.ts") {
    const lavamoatOpts = {
      policy: path.join(__dirname, "browserify", fileWithoutExt, "policy.json"),
      override: path.join(__dirname, "browserify", "policy-override.json"),
      writeAutoPolicy: process.env.LAVAMOAT_AUTO_POLICY === "true",
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
          "getSelection",
        ],
        scuttlerName: "SCUTTLER",
      },
    };

    b = b.plugin("lavamoat-browserify", lavamoatOpts);
  }

  b.transform("@browserify/uglifyify", {
    global: true,
    sourceMap: false,
  })
    .bundle()
    .pipe(fs.createWriteStream(dest));
}
