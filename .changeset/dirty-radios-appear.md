---
"@soothe/vault": minor
"@soothe/extension": minor
---

- Implemented @cosmjs/tendermint-rpc to replace @cosmjs/stargate which is using websockets
- Improved the `getFee` functionality to not depened on the private key. It extracts the signer address from the messages.
