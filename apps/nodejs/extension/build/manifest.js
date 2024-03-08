const baseManifest = {
  manifest_version: 3,
  name: "Soothe Vault",
  description: "Extension to manage your vault of wallets",
  version: "0.0.1",
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
  host_permissions: ["http://*/*", "https://*/*"],
};

const basePermissions = ["storage", "unlimitedStorage", "tabs"];
const chromiumPermissions = [...basePermissions, "offscreen"];

const baseChromiumManifest = {
  ...baseManifest,
  background: {
    service_worker: "js/background.js",
  },
  externally_connectable: {
    ids: [],
    matches: [],
  },
  permissions: chromiumPermissions,
};

const baseFirefoxManifest = {
  ...baseManifest,
  background: {
    scripts: ["js/background.js"],
  },
  permissions: basePermissions,
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';",
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
