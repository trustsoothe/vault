---
"@soothe/extension": patch
---

Fixed balances (and any other state) freezing in an open popup or extension tab after the browser terminated the extension's background worker (idle, sleep/wake, memory pressure, extension update): the page now reconnects to the background store when the connection drops, reloads the current state and refetches balances and prices right away. Previously the page kept showing its last snapshot until it was reopened.
