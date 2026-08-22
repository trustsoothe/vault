---
"@soothe/extension": patch
---

Lighter extension pages: libsodium (~940 KB plus a WebAssembly module instantiated on every page load, pulled in by `@cosmjs/crypto` for APIs the vault never uses) is no longer bundled.

Regenerated the LavaMoat policy for the updated dependency tree: the dependency bumps introduced new transitive packages (`to-buffer`, `typed-array-buffer`, `qs` → `side-channel`, `hash-base` → `readable-stream`, `protobufjs` → `long`, ...) that were missing from the policy, which made production builds fail at startup with `Policy does not allow importing ... from undefined`.
