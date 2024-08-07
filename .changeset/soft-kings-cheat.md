---
"@poktscan/extension": minor
"@poktscan/vault": minor
---

# Extension

* The UI was replaced with a new one.
* Added Activities that will have the transactions made with the extensions and the pending mints.
* Added option to create account as child of HD Seed from Create New Account modal.
* Removed Blocked Sites in Site Connections.
* Added Selected Network Price at the bottom of Selected Account view.
* Added functionality to Seeds to be able to use them with all protocols.

# Vault

* Added CRUD functionality to manage recovery phrases.
* Updated addHDWalletAccount method of VaultTeller and createHDWalletAccount method of Protocol Services to only create
  an account from an HD Seed and be able to pass a name for the account.
