---
"@soothe/extension": minor
"@soothe/vault": minor
---

# Web

* Updated send transaction logic to capture sent but invalid transactions and show the feedback in the UI.
* Improved UX of Recipient autocomplete (Public Address input)
* Added version to Unlock Vault view

# Vault

* Added error `TransactionSentButInvalidError` to throw with this specific error when the transaction was sent to the
  network but returns with a code not equal to 0
