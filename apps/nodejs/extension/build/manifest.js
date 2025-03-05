const packageJson = require('../package.json')
const basePermissions = ["storage", "unlimitedStorage"];

const baseManifest = {
  manifest_version: 3,
  name: "Soothe Vault",
  description:
    "A secure, user-friendly multi-blockchain wallet for managing digital assets with encryption, easy sync & web3 connectivity.",
  icons: {
    16: "icons/16.png",
    19: "icons/19.png",
    32: "icons/32.png",
    38: "icons/38.png",
    48: "icons/48.png",
    64: "icons/64.png",
    128: "icons/128.png",
    512: "icons/512.png",
  },
  action: {
    default_icon: {
      16: "icons/16.png",
      19: "icons/19.png",
      32: "icons/32.png",
      38: "icons/38.png",
      64: "icons/64.png",
      128: "icons/128.png",
      512: "icons/512.png",
    },
    default_popup: "home.html?popup=true",
  },
  permissions: basePermissions,
};


const baseChromiumManifest = {
  ...baseManifest,
  background: {
    service_worker: "js/background-loader.js"
  },
  permissions: [...basePermissions, "activeTab", "tabs"],
};

const baseFirefoxManifest = {
  ...baseManifest,
  background: {
    page: "background.html",
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';",
  },
  host_permissions: ["http://*/*", "https://*/*"],
  browser_specific_settings: {
    gecko: {
      id: "{d2abee6f-9c77-4f41-acd8-a88b48d01a91}",
    },
  },
};

const getContentScript = (isFirefox) => [
  {
    matches: ["http://*/*", "https://*/*"],
    run_at: "document_start",
    js: ["js/proxy.js"],
  },
  {
    all_frames: true,
    js: ["js/provider.js"],
    matches: ["http://*/*", "https://*/*"],
    world: isFirefox ? undefined : "MAIN",
    run_at: "document_start",
  },
];

function getManifest(isFirefox) {
  const packageJson = require("../package.json");
  const baseManifest = isFirefox ? baseFirefoxManifest : baseChromiumManifest;

  return JSON.stringify(
    {
      version: packageJson.version,
      ...baseManifest,
      content_scripts: getContentScript(isFirefox),
    },
    null,
    2
  );
}

module.exports = getManifest;
