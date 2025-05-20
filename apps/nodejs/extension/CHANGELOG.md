# @soothe/extension

## 0.3.0

### Minor Changes

- 019b443: # Extension

  - Added support for signing Pocket Network (morse) transactions.

  # Vault

  - Exported Pocket Network (morse) transactions types without enum.

- 019b443: Added buf.gen.yaml to configure proto generation for Cosmos and Pocket Network. Introduced generated types, clients, and utilities in the project. Updated package.json to include @bufbuild/protobuf as a new dependency for handling protobuf.

  Updated the CosmosProtocolService to expect a list of messages.

  Replaced `shannonFee` with `maxFeePerGas` for Cosmos transactions and removed unused structures. Introduced gas-related fields and enhanced fee calculation logic. Improved code reusability by modularizing message building and transaction fee options.

  Extracted transaction signing logic into a dedicated `signTransaction` method to improve code modularity and reusability. Updated `sendTransaction` to leverage this method, simplifying its implementation and separating concerns. Minor adjustments made to align with the new workflow.

  Revised Cosmos transaction structure to include detailed message payloads, replacing flat properties like 'amount'. Updated `sendTransaction` to use `StargateClient` instead of `SigningStargateClient`, ensuring compatibility with transaction broadcasting. Adjusted test imports and structures for consistency.

### Patch Changes

- 019b443: Adds "View Public Key" functionality for accounts management
- 4cd9075: \* Updated `package.json` to include the following scripts: - `build:chromium`: to build the extension for chromium based browsers - `build:firefox`: to build the extension for firefox browser

  - Updated README.md to specify the build commands for the extension and the result location
  - Updated README.md of the extension to clarify how to inject the content scripts automatically in Firefox.
  - Updated build of extension to place the result of the build for chromium based browsers at `dist/chromium` and for
    firefox at `dist/firefox`
  - Updated version of `@lavamoat/webpack` which includes the scuttling options, as result of it we no longer need the
    update-lavamoat script.

## 0.2.3

### Patch Changes

- 7ff907e: Adds "systemvars" option on DotEnv-Webpack.

## 0.2.2

### Patch Changes

- af3b3cf: \* Updated manifest to import the version from the package.json.
  - Updated backup versioning to be separate from the extension version.

## 0.2.1

### Patch Changes

- 1447d6a: # Extension

  - Updated manifest version

## 0.2.0

### Minor Changes

- 9370684: # Extension

  - Updated proxy and provider to stop importing from @soothe/vault.
  - Updated build script to use LavaMoat with webpack instead of browserify.
  - Removed browserify related dependencies.

  # Vault

  - Exported DAOActionArray type.
  - Exported SupportedProtocolsArray type.

### Patch Changes

- bb1c6cf: \* Bumped dependencies.

  # Extension

  - Fixed a bug throwing an error when the balance of a Pocket account was not zero.
  - Fixed build of the extension for Firefox.

## 0.1.5

### Patch Changes

- 1395c36: Fixed bundle sizes.

## 0.1.4

### Patch Changes

- 1efde18: Update manifest description to match the limit of 132 characters.

## 0.1.3

### Patch Changes

- 6802954: Changed packages names
- 6b5c3b3: \* Updated version removing "beta" from name and description on manifest file.

## 0.1.2

### Patch Changes

- f2fa398: Updates lavamaout policies to support comojs upgraded.
- 01c4fb4: Removes warnings on the extensions management view. Reduces bundle size.

## 0.1.1

### Patch Changes

- 49e4adc: Updates the github_token permissions on the release workflow so that it can write contents

## 0.1.0

### Minor Changes

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

- fc8c6ad: Concatenate the public and private key for Pocket Network wallets derived from a seed phrase.
- f87fbbb: Adds support for the new Cosmos protocol. Also adds support for configurations that allow notices and feature
  disabling.
- 8ccfae2: Adds support for Sign Personal Messages, Adds support for Sign Transaction. Adds a new validateTransaction
  message.
- 15f1f71: Updates Pre-Release workflow name
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

- 8543de8: Updates the pre-release workflow to be explicitly called by the version packages workflow.
- 5985ffb: Fixed issue with prices of assets due to changes of the api
- 3f7c2ea: # Extension

  - Fixed bug caused by RTK Query that was causing to not reflect the balance of the wallet was loading when changing
    the
    network.
  - Fixed issue to prevent make several requests to the price api when loading the UI at the first time.
  - Changed logo for new one.
  - Added option to add new accounts on connection request.

- 88c2b38: Upgrades webpack and comosjs libraries
- 6f985db: Added scripts to generate the zipped files for the chromium and firefox builds. Enchanced the CI support
  changesets and to automatically create the release (with assets) when the PR is merged.
- 87ce3bf: \* Fixed reduce without initial value.
  - Fixed typo "Enabled" in Security Settings when initializing vault.
  - Updated private key input type to password in import account.
