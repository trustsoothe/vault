---
"@soothe/extension": patch
"@soothe/vault": patch
---

More resilient balance, fee and Pocket parameter requests:

- Read requests (balances, fees, Pocket params/app/node queries) are now bounded by a 20s timeout and retried once before falling back to the next RPC, instead of hanging indefinitely.
- Preferred custom RPCs that accumulated too many errors get a new chance: their error count is reset when they answer successfully and, in any case, every 10 minutes (previously only when the RPC was edited).
- `@soothe/vault` reuses one Comet38 (Shannon) and one Eth (EVM) client per RPC endpoint instead of creating a new one on every request; the Morse balance request is bounded by a 20s timeout.
- Shannon transactions no longer fetch the whole genesis to learn the chain id (nodes with a large genesis, like Pocket Beta, reject that call with "genesis response is large, please use the genesis_chunked API"); the chain id now comes from the node status and is cached per RPC endpoint.
- Cleaned up React/MUI development warnings: the recipient autocomplete "Clear" control is no longer a button nested in MUI's clear button, `PasswordInput` forwards its ref to the input, summary dividers have keys, and the tooltip arrow SVG receives its ref without leaking MUI's `ownerState` prop (SVGR now forwards refs).
