---
"@poktscan/vault-specs": minor
"@poktscan/vault": minor
---

* Introduces the new RecoveryPhrase objects that are stored within the vault
* Updates the "importRecoveryPhrase" so that it only adds a new Phrase to the vault without creating any accounts.
* Updates the addHDWallet functionality to expect a recoveryPhraseId
* Adds a new listRecoveryPhrase method
* Adds a new set of permissions for "seed" objects.

One key different is that operations involving HDWallet use the recoveryPhraseID instead of the actual recovery phrase. For instance, addHDWalletAccount now expects the recoveryPhraseId and it automatically takes care of creating the master key account if needed.
