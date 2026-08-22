---
"@soothe/extension": patch
"@soothe/vault": patch
---

- Balance fetch errors are now actionable: the "Balance fetch failed" snackbar groups the failures by network (e.g. "Pocket (Morse Mainnet): 2 accounts — Failed to fetch balance: Failed to fetch") and includes the underlying error message instead of only a count. `@soothe/vault` keeps the original cause when wrapping balance request failures in `NetworkRequestError` (Cosmos/Shannon, EVM) and includes the HTTP status for Morse.
- When a network disables balance fetching (network notice), the account header shows `-` instead of a misleading `0` balance.
- The protocol selector (new/import account) shows one option per protocol even if the networks config flags more than one network of the same protocol as protocol default.
- Added `'wasm-unsafe-eval'` to the extension pages Content Security Policy (Chromium and Firefox): libsodium, pulled in by `@cosmjs/crypto`, instantiates a WebAssembly module at load time and was being blocked, producing an unhandled `SES_UNHANDLED_REJECTION ... WebAssembly.instantiate()` error on every page load.
- Opted in to React Router's `v7_startTransition` future flag.
