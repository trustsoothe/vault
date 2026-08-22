/**
 * Stub for `libsodium-wrappers-sumo`.
 *
 * `@cosmjs/crypto` depends on libsodium (Argon2id, Ed25519, XChaCha20) but the
 * vault only uses its Secp256k1 / Slip10 / Bip39 / sha256 exports, none of
 * which touch libsodium. The real package is ~940 KB of JS plus a WebAssembly
 * module instantiated at load time (which needs 'wasm-unsafe-eval' in the
 * CSP), so we alias it to this stub in webpack.
 *
 * `ready` resolves so that nothing awaiting it hangs; any other property
 * access throws a clear error instead of failing somewhere deeper.
 */
const stub = {
  ready: Promise.resolve(),
};

module.exports = new Proxy(stub, {
  get(target, prop) {
    if (prop in target || typeof prop === "symbol") {
      return target[prop];
    }
    // module interop probes
    if (prop === "__esModule" || prop === "default" || prop === "then") {
      return undefined;
    }
    throw new Error(
      `libsodium.${String(
        prop
      )} is not available: libsodium is not bundled in Soothe Vault`
    );
  },
});
