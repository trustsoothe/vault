# @soothe/vault

## 0.5.1

### Patch Changes

- e3aec2a: - Removes requirement for balance when migrating morse accounts.
  - Uses default gas estimation value in cases where 'auto' was requested but there is not public key on chain
- e3aec2a: Refactor `ImportForm` to use `Controller` for `PasswordInput` binding with `useFormContext`

## 0.5.0

### Minor Changes

- 4c5e3a7: # Web

  - Updated send transaction logic to capture sent but invalid transactions and show the feedback in the UI.
  - Improved UX of Recipient autocomplete (Public Address input)
  - Added version to Unlock Vault view

  # Vault

  - Added error `TransactionSentButInvalidError` to throw with this specific error when the transaction was sent to the
    network but returns with a code not equal to 0

### Patch Changes

- 35d47a2: Improve seed phrase handling and validation in RemoveSeedModal and FillSeedPhrase

      - Added `useEffect` in RemoveSeedModal to update `phraseSize` based on phrase length.
      - Enhanced FillSeedPhrase with whitespace trimming and word filtering for better accuracy.
      - Refined logic to handle empty or invalid seed words.

  Add `useCapsLock` hook and integrate CapsLock warning in PasswordInput

      - Introduced `useCapsLock` hook to detect CapsLock state.
      - Added a warning message in `PasswordInput` when CapsLock is enabled.
      - Updated `TransactionDetailModal` label to reflect success status.

  Refactor protocol and transaction handling

      - Updated `watch` usage in `ImportAccountModal` to include `protocol` simplifying dependency tracking.
      - Replaced redundant calls to `watch("protocol")` with the `protocol` variable for cleaner logic.
      - Removed debug `console.log` statement from `PoktTransactionRequest`.
      - Fixed lodash `debounce` import path in `BaseTransaction`.
      - Restored `maxFeePerGas` to the transaction schema for extended support of users that might have this stored on their data.

  Add gas-related properties (`estimatedGas`, `gasAdjustment`, `gasPrice`) to transaction handling

      Expanded transaction schema and logic to include gas-related properties. Updated Cosmos and Redux implementations for improved gas calculation and flexibility.

  Add support for `gasPrice`, `gas`, and `gasAdjustment` in transaction parameters

      Expanded transaction parameter handling by introducing `gasPrice`, `gas`, and `gasAdjustment` properties. Updated existing logic to replace `maxFeePerGas` with `gasPrice` for consistency across transactions.

## 0.4.1

### Patch Changes

- 2f81eae: Switch broadcast method from async to sync in Cosmos service

## 0.4.0

### Minor Changes

- b1b97f5: Enhance Cosmos fee handling and transaction validation

  - Updated fee display logic for Cosmos when the recipient address, in send transaction form, is missing.
  - Introduced `decimal.js` dependency for precise calculations converting from upokt to pokt in Cosmos Shannon
    operations.
  - Adjusted LavaMoat policy to support the new dependency.
  - Streamlined Cosmos transaction fee calculations.

## 0.3.0

### Minor Changes

- 3b5fbad: # Extension

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

## 0.2.0

### Minor Changes

- 019b443: Added buf.gen.yaml to configure proto generation for Cosmos and Pocket Network. Introduced generated types, clients, and utilities in the project. Updated package.json to include @bufbuild/protobuf as a new dependency for handling protobuf.

  Updated the CosmosProtocolService to expect a list of messages.

  Replaced `shannonFee` with `maxFeePerGas` for Cosmos transactions and removed unused structures. Introduced gas-related fields and enhanced fee calculation logic. Improved code reusability by modularizing message building and transaction fee options.

  Extracted transaction signing logic into a dedicated `signTransaction` method to improve code modularity and reusability. Updated `sendTransaction` to leverage this method, simplifying its implementation and separating concerns. Minor adjustments made to align with the new workflow.

  Revised Cosmos transaction structure to include detailed message payloads, replacing flat properties like 'amount'. Updated `sendTransaction` to use `StargateClient` instead of `SigningStargateClient`, ensuring compatibility with transaction broadcasting. Adjusted test imports and structures for consistency.

### Patch Changes

- 019b443: # Extension

  - Added support for signing Pocket Network (morse) transactions.

  # Vault

  - Exported Pocket Network (morse) transactions types without enum.

- 019b443: Adds "View Public Key" functionality for accounts management

## 0.1.2

### Patch Changes

- 9370684: # Extension

  - Updated proxy and provider to stop importing from @soothe/vault.
  - Updated build script to use LavaMoat with webpack instead of browserify.
  - Removed browserify related dependencies.

  # Vault

  - Exported DAOActionArray type.
  - Exported SupportedProtocolsArray type.

- bb1c6cf: \* Bumped dependencies.

  # Extension

  - Fixed a bug throwing an error when the balance of a Pocket account was not zero.
  - Fixed build of the extension for Firefox.

## 0.1.1

### Patch Changes

- 6802954: Changed packages names

## 0.1.0

### Minor Changes

- fc8c6ad: Concatenate the public and private key for Pocket Network wallets derived from a seed phrase.
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
- 67ef1e0: \* Uses the gas price (on EVM networks) when unable to fetch a suggested gas or priority fee. This enables
  support for all EVMs. Officially, we're adding Polygon, Avalance C, Arbitrum One, Gnosis, Binance Smart Chain, Fantom
  and Optimism.
- 8ccfae2: Adds support for Sign Personal Messages, Adds support for Sign Transaction. Adds a new validateTransaction
  message.
- f4446e4: # Extension

  - The UI was replaced with a new one.
  - Added Activities that will have the transactions made with the extensions and the pending mints.
  - Added option to create account as child of HD Seed from Create New Account modal.
  - Removed Blocked Sites in Site Connections.
  - Added Selected Network Price at the bottom of Selected Account view.
  - Added functionality to Seeds to be able to use them with all protocols.

  # Vault

  - Added CRUD functionality to manage recovery phrases.
  - Updated addHDWalletAccount method of VaultTeller and createHDWalletAccount method of Protocol Services to only
    create
    an account from an HD Seed and be able to pass a name for the account.

- 15ef995: - Accounts - Create from private key - Create from recovery seeds - Retrieve balance - Send transactions (
  Tokens only)

  Missing functionality:

  - Sign Personal Data
  - Final Fee retrieval calculation (not yet implemented, see: https://github.com/pokt-network/poktroll/issues/794)

### Patch Changes

- 4da636b: # Extension

  - Created runWithNetworks function to handle the logic of running requests with custom rpcs and the default network.
  - Added code to handle the following pocket network transactions:
    - Stake Node
    - Unstake Node
    - Unjail Node
    - Stake App
    - Change Param
    - DAO Transfer
    - Upgrade
  - Updated account selectable buttons on Connection Request to emphasize that those are clickable buttons.
  - Added Add recipient to contacts when a send transaction is sent but the recipient is not in the contacts list.
  - Added close button to retry snackbars when title and content are provided.
  - Updated get public key request to open unlock vault modal if the vault is locked.
  - Added GetAllParams, GetApp and GetNode RTK queries.
  - Updated RecipientAutocomplete to accept public keys and to be able to select current selected account as a
    recipient.
  - Updated Summary to be able to pass a component as a label.

  # Vault

  - Added queryApp to Pocket Network protocol service.
  - Added Upgrade transaction to Pocket Network protocol service.
  - Added getAllParamsByHeight to Pocket Network protocol service.
  - Updated build transaction message of DAO Transfer to pass the correct amount.
  - Updated queryNode of Pocket Network protocol service to return null if the node does not exist.

- 88c2b38: Upgrades webpack and comosjs libraries
