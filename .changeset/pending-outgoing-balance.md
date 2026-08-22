---
"@soothe/extension": patch
---

The Send form now accounts for transactions that were just sent but are not yet reflected in the balance: their amount and fee are subtracted from the spendable balance (and shown under the account balance), so a second transaction that would fail on-chain with "insufficient funds" is rejected before signing with "Insufficient balance (X pending in previous transactions)". Pending amounts are forgotten as soon as the balance reflects them or after 10 minutes.
