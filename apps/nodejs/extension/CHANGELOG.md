# @soothe/extension

## 0.8.0

### Minor Changes

- e72fb85: Shannon (Cosmos) transactions are now sent as unordered transactions (Cosmos SDK >= 0.53): they no longer depend on the account sequence, so several transactions can be sent from the same account within the same block. Previously a second transaction sent before the first one was included (blocks are ~1 minute) failed with "account sequence mismatch" or "tx already exists in cache".

  - The unordered timeout timestamp is derived from the node's latest block time (not the local clock) and is unique per transaction.
  - `CosmosProtocolTransaction.unordered` (default `true`) can be set to `false` to sign a classic sequence-based transaction.
  - Fee simulation uses the wallet's own public key when signing, so brand-new accounts (no public key on chain yet) get a real gas estimate instead of the default.
  - Broadcast rejections such as "tx already exists in cache" and "account sequence mismatch" are reported with a readable message in the transaction error view.
  - Networks can opt out per chain with `unorderedTransactions: false` in the networks configuration (absent means unordered).

### Patch Changes

- a18bd26: The remote assets the extension fetches at runtime (networks, assets, chain maps and icons) moved from the DigitalOcean Space (being decommissioned) to the version-controlled https://github.com/pokt-network/soothe-assets repository, served through GitHub Pages.
- e72fb85: - Balance fetch errors are now actionable: the "Balance fetch failed" snackbar groups the failures by network (e.g. "Pocket (Morse Mainnet): 2 accounts — Failed to fetch balance: Failed to fetch") and includes the underlying error message instead of only a count. `@soothe/vault` keeps the original cause when wrapping balance request failures in `NetworkRequestError` (Cosmos/Shannon, EVM) and includes the HTTP status for Morse.
  - When a network disables balance fetching (network notice), the account header shows `-` instead of a misleading `0` balance.
  - The protocol selector (new/import account) shows one option per protocol even if the networks config flags more than one network of the same protocol as protocol default.
  - Added `'wasm-unsafe-eval'` to the extension pages Content Security Policy (Chromium and Firefox): libsodium, pulled in by `@cosmjs/crypto`, instantiates a WebAssembly module at load time and was being blocked, producing an unhandled `SES_UNHANDLED_REJECTION ... WebAssembly.instantiate()` error on every page load.
  - Opted in to React Router's `v7_startTransition` future flag.
- e72fb85: More resilient balance, fee and Pocket parameter requests:

  - Read requests (balances, fees, Pocket params/app/node queries) are now bounded by a 20s timeout and retried once before falling back to the next RPC, instead of hanging indefinitely.
  - Preferred custom RPCs that accumulated too many errors get a new chance: their error count is reset when they answer successfully and, in any case, every 10 minutes (previously only when the RPC was edited).
  - `@soothe/vault` reuses one Comet38 (Shannon) and one Eth (EVM) client per RPC endpoint instead of creating a new one on every request; the Morse balance request is bounded by a 20s timeout.
  - Shannon transactions no longer fetch the whole genesis to learn the chain id (nodes with a large genesis, like Pocket Beta, reject that call with "genesis response is large, please use the genesis_chunked API"); the chain id now comes from the node status and is cached per RPC endpoint.
  - Cleaned up React/MUI development warnings: the recipient autocomplete "Clear" control is no longer a button nested in MUI's clear button, `PasswordInput` forwards its ref to the input, summary dividers have keys, and the tooltip arrow SVG receives its ref without leaking MUI's `ownerState` prop (SVGR now forwards refs).

- e72fb85: Lighter extension pages: libsodium (~940 KB plus a WebAssembly module instantiated on every page load, pulled in by `@cosmjs/crypto` for APIs the vault never uses) is no longer bundled.

  Regenerated the LavaMoat policy for the updated dependency tree: the dependency bumps introduced new transitive packages (`to-buffer`, `typed-array-buffer`, `qs` → `side-channel`, `hash-base` → `readable-stream`, `protobufjs` → `long`, ...) that were missing from the policy, which made production builds fail at startup with `Policy does not allow importing ... from undefined`.

- 3b43922: Dependency maintenance: applied the pending Dependabot security/patch bumps (protobufjs 7.6, lodash/lodash-es 4.18.1, webpack 5.104, axios, follow-redirects, form-data, pbkdf2, sha.js, cipher-base, bn.js, base-x, ajv, minimatch, brace-expansion, picomatch, micromatch, yaml, js-yaml, flatted, svgo, rollup, vite, diff, @babel/runtime, @babel/helpers, @xmldom/xmldom, cross-spawn, express/body-parser/qs/path-to-regexp, secp256k1, ws), bumped react-router-dom to 6.30.6 and uuid to 11.1.1 (dropped @types/uuid).
- 44a4b19: The Explore card shows the explorer's full hostname (e.g. "Open poktscan.beta.pocket.network") instead of only the base domain, which no longer distinguished the Pocket explorers.
- e72fb85: The Send form now accounts for transactions that were just sent but are not yet reflected in the balance: their amount and fee are subtracted from the spendable balance (and shown under the account balance), so a second transaction that would fail on-chain with "insufficient funds" is rejected before signing with "Insufficient balance (X pending in previous transactions)". Pending amounts are forgotten as soon as the balance reflects them or after 10 minutes.
- ece7663: Fixed two UI failures that only appear in production builds.

  Popper (used by every MUI tooltip and popper-based surface) reads `globalThis.ShadowRoot` when the anchor element has no parent node, which happens when the anchor is detached from the DOM while the popper still updates. LavaMoat's scuttling mode did not list `ShadowRoot` as an exception, so that read threw `LavaMoat - property "ShadowRoot" of globalThis is inaccessible under scuttling mode` and broke the copy-address button. `ShadowRoot` is now an exception; the LavaMoat policy already granted it to Popper's module. The copy-address button also clears its "Copied" timeout on unmount, so it no longer updates a detached tooltip.

  Dialogs now move focus off the element that opened them before MUI marks the rest of the app `aria-hidden`, and restore that focus once the dialog closes. Chrome refuses to apply `aria-hidden` to a subtree that still contains the focused element, which left the dialog's background exposed to assistive technology.

- a3d4667: Updated `@poktscan/vault-siwp` to the latest `shannon` commit, which accepts the `pocket-lego-testnet` (Pocket Beta) chain id: Sign-In-with-Pocket requests from websites now work on Pocket Beta.
- e72fb85: Fixed balances (and any other state) freezing in an open popup or extension tab after the browser terminated the extension's background worker (idle, sleep/wake, memory pressure, extension update): the page now reconnects to the background store when the connection drops, reloads the current state and refetches balances and prices right away. Previously the page kept showing its last snapshot until it was reopened.

  A balance query stuck in "fetching" for more than 90 seconds (a request that never returned, or a result lost while the background restarted) is now restarted automatically; previously it silently stopped polling and the last value stayed on screen until the page was reopened.

- a3d4667: Removed `'wasm-unsafe-eval'` from the extension pages Content Security Policy: nothing in the bundle instantiates WebAssembly anymore (libsodium is no longer shipped; protobufjs' long helper falls back to plain JS when blocked), so the wallet keeps the strictest `script-src 'self'` policy.

## 0.7.1

### Patch Changes

- be87fdd: Added Shannon Send transaction request
- 1c43920: Removed functionality allowing to paste accounts not saved in the vault in the migration process.

## 0.7.0

### Minor Changes

- f9b0984: - Requests are now also displayed in the popup for easier access.
  - Snackbars (toasts) now appear at the top when interacting with a request, ensuring action buttons (accept/reject)
    remain accessible.
  - Balance fetch failures are now grouped into a single snackbar instead of showing one per failed balance.
  - Added an Error Boundary view so users can report issues directly.
  - Improved handling of failed transactions in the Migration workflow.
  - Introduced a "Report Bug" page for reporting failed operations:
    - Currently implemented only for failed transactions (transactions not sent to the network).
    - Future support is planned for all operations (e.g., create account, import account, etc.).

### Patch Changes

- f9b0984: Fixed issue preventing firefox users to connect with vault from websites

## 0.6.2

### Patch Changes

- 800163e: Resolves a bug where the protocol selection is reverted to current app protocol when the import type changed.

## 0.6.1

### Patch Changes

- e3aec2a: - Removes requirement for balance when migrating morse accounts.
  - Uses default gas estimation value in cases where 'auto' was requested but there is not public key on chain
- e3aec2a: Refactor `ImportForm` to use `Controller` for `PasswordInput` binding with `useFormContext`

## 0.6.0

### Minor Changes

- 4c5e3a7: # Web

  - Updated send transaction logic to capture sent but invalid transactions and show the feedback in the UI.
  - Improved UX of Recipient autocomplete (Public Address input)
  - Added version to Unlock Vault view

  # Vault

  - Added error `TransactionSentButInvalidError` to throw with this specific error when the transaction was sent to the
    network but returns with a code not equal to 0

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

## 0.5.2

### Patch Changes

- 2f81eae: Switch broadcast method from async to sync in Cosmos service
- 0941648: \* Added Cosmos transaction support in vault import
  - Improved snackbar UI handling

## 0.5.1

### Patch Changes

- 4372d2c: Display app version and handle browser available updates.

## 0.5.0

### Minor Changes

- b1b97f5: Enhance Cosmos fee handling and transaction validation

  - Updated fee display logic for Cosmos when the recipient address, in send transaction form, is missing.
  - Introduced `decimal.js` dependency for precise calculations converting from upokt to pokt in Cosmos Shannon
    operations.
  - Adjusted LavaMoat policy to support the new dependency.
  - Streamlined Cosmos transaction fee calculations.

## 0.4.0

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

## 0.3.3

### Patch Changes

- a2e01a6: \* Added "pocket" as the default chainId selected for Cosmos protocol.
  - Fixed Account selected shown on the request header for bulk sign transaction requests.
  - Removed nonce on SIWP UI.

## 0.3.2

### Patch Changes

- 7442461: Just to update extension version.

## 0.3.1

### Patch Changes

- 53b08d6: \* Added a script to sort number arrays in Firefox runtime.js builds

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
