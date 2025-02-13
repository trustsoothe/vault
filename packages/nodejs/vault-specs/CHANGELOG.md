# @soothe/vault-specs

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
