---
"@soothe/vault": patch
"@soothe/extension": patch
---

Pocket Shannon transactions are now signed with @noble/curves instead of elliptic (CosmJS 0.33.1 -> 0.34.1). elliptic <= 6.6.1 can produce faulty ECDSA signatures that could expose the private key (GHSA-848j-6mx2-7j84); signatures for valid inputs are byte-identical to before. CosmJS RPC requests now go through cross-fetch instead of axios.
