# @soothe/vault-specs

## 0.2.0

### Minor Changes

- 019b443: Added buf.gen.yaml to configure proto generation for Cosmos and Pocket Network. Introduced generated types, clients, and utilities in the project. Updated package.json to include @bufbuild/protobuf as a new dependency for handling protobuf.

  Updated the CosmosProtocolService to expect a list of messages.

  Replaced `shannonFee` with `maxFeePerGas` for Cosmos transactions and removed unused structures. Introduced gas-related fields and enhanced fee calculation logic. Improved code reusability by modularizing message building and transaction fee options.

  Extracted transaction signing logic into a dedicated `signTransaction` method to improve code modularity and reusability. Updated `sendTransaction` to leverage this method, simplifying its implementation and separating concerns. Minor adjustments made to align with the new workflow.

  Revised Cosmos transaction structure to include detailed message payloads, replacing flat properties like 'amount'. Updated `sendTransaction` to use `StargateClient` instead of `SigningStargateClient`, ensuring compatibility with transaction broadcasting. Adjusted test imports and structures for consistency.

### Patch Changes

- 019b443: Adds "View Public Key" functionality for accounts management
- Updated dependencies [019b443]
- Updated dependencies [019b443]
- Updated dependencies [019b443]
  - @soothe/vault@0.2.0

## 0.1.1

### Patch Changes

- 6802954: Changed packages names
- Updated dependencies [6802954]
  - @soothe/vault-storage-filesystem@0.0.2
  - @soothe/vault-storage-extension@0.0.2
  - @soothe/vault-encryption-web@0.0.2
  - @soothe/vault@0.1.1

## 0.1.0

### Minor Changes

- f965d2d: \* Introduces the new RecoveryPhrase objects that are stored within the vault

  - Updates the "importRecoveryPhrase" so that it only adds a new Phrase to the vault without creating any accounts.
  - Updates the addHDWallet functionality to expect a recoveryPhraseId
  - Adds a new listRecoveryPhrase method
  - Adds a new set of permissions for "seed" objects.

  One key different is that operations involving HDWallet use the recoveryPhraseID instead of the actual recovery
  phrase. For instance, addHDWalletAccount now expects the recoveryPhraseId and it automatically takes care of creating
  the master key account if needed.

- f87fbbb: Adds support for the new Cosmos protocol. Also adds support for configurations that allow notices and feature
  disabling.
- 8ccfae2: Adds support for Sign Personal Messages, Adds support for Sign Transaction. Adds a new validateTransaction
  message.
- 15ef995: - Accounts - Create from private key - Create from recovery seeds - Retrieve balance - Send transactions (
  Tokens only)

  Missing functionality:

  - Sign Personal Data
  - Final Fee retrieval calculation (not yet implemented, see: https://github.com/pokt-network/poktroll/issues/794)

### Patch Changes

- 88c2b38: Upgrades webpack and comosjs libraries
- Updated dependencies [4da636b]
- Updated dependencies [fc8c6ad]
- Updated dependencies [f965d2d]
- Updated dependencies [f87fbbb]
- Updated dependencies [67ef1e0]
- Updated dependencies [8ccfae2]
- Updated dependencies [88c2b38]
- Updated dependencies [f4446e4]
- Updated dependencies [15ef995]
  - @soothe/vault@0.1.0
