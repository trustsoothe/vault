---
"@soothe/extension": patch
---

Lighter extension pages: libsodium (~940 KB plus a WebAssembly module instantiated on every page load, pulled in by `@cosmjs/crypto` for APIs the vault never uses) is no longer bundled, and the password strength meter (~800 KB of dictionaries) is loaded on demand when a vault password is being created instead of on every load.
