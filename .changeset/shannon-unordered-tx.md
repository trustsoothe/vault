---
"@soothe/extension": minor
"@soothe/vault": minor
---

Shannon (Cosmos) transactions are now sent as unordered transactions (Cosmos SDK >= 0.53): they no longer depend on the account sequence, so several transactions can be sent from the same account within the same block. Previously a second transaction sent before the first one was included (blocks are ~1 minute) failed with "account sequence mismatch" or "tx already exists in cache".

- The unordered timeout timestamp is derived from the node's latest block time (not the local clock) and is unique per transaction.
- `CosmosProtocolTransaction.unordered` (default `true`) can be set to `false` to sign a classic sequence-based transaction.
- Fee simulation uses the wallet's own public key when signing, so brand-new accounts (no public key on chain yet) get a real gas estimate instead of the default.
- Broadcast rejections such as "tx already exists in cache" and "account sequence mismatch" are reported with a readable message in the transaction error view.
- Networks can opt out per chain with `unorderedTransactions: false` in the networks configuration (absent means unordered).
