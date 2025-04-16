---
"@soothe/vault-specs": minor
"@soothe/extension": minor
"@soothe/vault": minor
---

Added buf.gen.yaml to configure proto generation for Cosmos and Pocket Network. Introduced generated types, clients, and utilities in the project. Updated package.json to include @bufbuild/protobuf as a new dependency for handling protobuf.

Updated the CosmosProtocolService to expect a list of messages.

Replaced `shannonFee` with `maxFeePerGas` for Cosmos transactions and removed unused structures. Introduced gas-related fields and enhanced fee calculation logic. Improved code reusability by modularizing message building and transaction fee options.

Extracted transaction signing logic into a dedicated `signTransaction` method to improve code modularity and reusability. Updated `sendTransaction` to leverage this method, simplifying its implementation and separating concerns. Minor adjustments made to align with the new workflow.

Revised Cosmos transaction structure to include detailed message payloads, replacing flat properties like 'amount'. Updated `sendTransaction` to use `StargateClient` instead of `SigningStargateClient`, ensuring compatibility with transaction broadcasting. Adjusted test imports and structures for consistency.
