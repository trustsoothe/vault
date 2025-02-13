const baseManifest = {
  manifest_version: 3,
  name: "Soothe Vault",
  description:
    "Soothe Vault is a secure, user-friendly multi-blockchain wallet (EVM, Cosmos, Pocket) for managing, storing, and interacting with digital assets. It offers high-grade encryption, easy synchronization, and decentralized website connection.",
  version: "0.1.3",
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
  permissions: ["storage", "unlimitedStorage"],
};

const basePermissions = ["storage", "unlimitedStorage"];

const baseChromiumManifest = {
  ...baseManifest,
  background: {
    service_worker: "js/background.js",
  },
  externally_connectable: {
    ids: ['*'],
    matches: ['http://*/*', 'https://*/*'],
  },
  permissions: [...basePermissions, "activeTab", "tabs"],
};

const baseFirefoxManifest = {
  ...baseManifest,
  background: {
    scripts: ["js/background.js"],
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';",
  },
  permissions: [...basePermissions],
  host_permissions: ["http://*/*", "https://*/*"],
  browser_specific_settings: {
    gecko: {
      id: "{d2abee6f-9c77-4f41-acd8-a88b48d01a91}",
    },
  },
};

const getContentScript = (isFirefox, isLavamoat) => [
  {
    matches: ["http://*/*", "https://*/*"],
    run_at: "document_start",
    js: isLavamoat ? ["js/proxy.js"] : ["js/vendor.js", "js/proxy.js"],
  },
  {
    all_frames: true,
    js: ["js/provider.js"],
    matches: ["http://*/*", "https://*/*"],
    world: isFirefox ? undefined : "MAIN",
    run_at: "document_start",
  },
];

function getManifest(isFirefox, isLavamoat) {
  const baseManifest = isFirefox ? baseFirefoxManifest : baseChromiumManifest;

  return JSON.stringify(
    {
      ...baseManifest,
      content_scripts: getContentScript(isFirefox, isLavamoat),
    },
    null,
    2
  );
}

module.exports = getManifest;
