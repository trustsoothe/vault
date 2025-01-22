# @poktscan/extension

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
  - Updated RecipientAutocomplete to accept public keys and to be able to select current selected account as a recipient.
  - Updated Summary to be able to pass a component as a label.

  # Vault

  - Added queryApp to Pocket Network protocol service.
  - Added Upgrade transaction to Pocket Network protocol service.
  - Added getAllParamsByHeight to Pocket Network protocol service.
  - Updated build transaction message of DAO Transfer to pass the correct amount.
  - Updated queryNode of Pocket Network protocol service to return null if the node does not exist.

- fc8c6ad: Concatenate the public and private key for Pocket Network wallets derived from a seed phrase.
- f87fbbb: Adds support for the new Cosmos protocol. Also adds support for configurations that allow notices and feature disabling.
- 8ccfae2: Adds support for Sign Personal Messages, Adds support for Sign Transaction. Adds a new validateTransaction message.
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
  - Updated addHDWalletAccount method of VaultTeller and createHDWalletAccount method of Protocol Services to only create
    an account from an HD Seed and be able to pass a name for the account.

- 15ef995: - Accounts - Create from private key - Create from recovery seeds - Retrieve balance - Send transactions (Tokens only)

  Missing functionality:

  - Sign Personal Data
  - Final Fee retrieval calculation (not yet implemented, see: https://github.com/pokt-network/poktroll/issues/794)

### Patch Changes

- 8543de8: Updates the pre-release workflow to be explicitly called by the version packages workflow.
- 5985ffb: Fixed issue with prices of assets due to changes of the api
- 3f7c2ea: # Extension

  - Fixed bug caused by RTK Query that was causing to not reflect the balance of the wallet was loading when changing the
    network.
  - Fixed issue to prevent make several requests to the price api when loading the UI at the first time.
  - Changed logo for new one.
  - Added option to add new accounts on connection request.

- 88c2b38: Upgrades webpack and comosjs libraries
- 6f985db: Added scripts to generate the zipped files for the chromium and firefox builds. Enchanced the CI support changesets and to automatically create the release (with assets) when the PR is merged.
- 87ce3bf: \* Fixed reduce without initial value.
  - Fixed typo "Enabled" in Security Settings when initializing vault.
  - Updated private key input type to password in import account.
