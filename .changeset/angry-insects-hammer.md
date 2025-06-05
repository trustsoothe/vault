---
"@soothe/extension": minor
"@soothe/vault": minor
---

Enhance Cosmos fee handling and transaction validation

- Updated fee display logic for Cosmos when the recipient address, in send transaction form, is missing.
- Introduced `decimal.js` dependency for precise calculations converting from upokt to pokt in Cosmos Shannon
  operations.
- Adjusted LavaMoat policy to support the new dependency.
- Streamlined Cosmos transaction fee calculations.
