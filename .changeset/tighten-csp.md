---
"@soothe/extension": patch
---

Removed `'wasm-unsafe-eval'` from the extension pages Content Security Policy: nothing in the bundle instantiates WebAssembly anymore (libsodium is no longer shipped; protobufjs' long helper falls back to plain JS when blocked), so the wallet keeps the strictest `script-src 'self'` policy.
