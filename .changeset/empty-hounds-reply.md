---
"@poktscan/extension": minor
"@poktscan/vault": patch
---

# Extension

* Created runWithNetworks function to handle the logic of running requests with custom rpcs and the default network.
* Added code to handle the following pocket network transactions:
    * Stake Node
    * Unstake Node
    * Unjail Node
    * Stake App
    * Change Param
    * DAO Transfer
    * Upgrade
* Updated account selectable buttons on Connection Request to emphasize that those are clickable buttons.
* Added Add recipient to contacts when a send transaction is sent but the recipient is not in the contacts list.
* Added close button to retry snackbars when title and content are provided.
* Updated get public key request to open unlock vault modal if the vault is locked.
* Added GetAllParams, GetApp and GetNode RTK queries.
* Updated RecipientAutocomplete to accept public keys and to be able to select current selected account as a recipient.
* Updated Summary to be able to pass a component as a label.

# Vault

* Added queryApp to Pocket Network protocol service.
* Added Upgrade transaction to Pocket Network protocol service.
* Added getAllParamsByHeight to Pocket Network protocol service.
* Updated build transaction message of DAO Transfer to pass the correct amount.
* Updated queryNode of Pocket Network protocol service to return null if the node does not exist.
