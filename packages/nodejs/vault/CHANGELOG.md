# @soothe/vault

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
