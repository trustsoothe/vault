---
"@soothe/vault": minor
"@soothe/extension": minor
---

# Extension

- Updated LavaMoat policy.
- Add "faucet" to the Network interface.
- Set "pocket" as the default `shannonChainId`.
- Corrected grammatical errors, improving UI text clarity.
- Enhanced migration instructions for better user guidance.
- Added faucet links for networks.

# Vault

- Implemented @cosmjs/tendermint-rpc to replace @cosmjs/stargate which is using websockets
- Improved the `getFee` functionality to not depened on the private key. It extracts the signer address from the
  messages.
