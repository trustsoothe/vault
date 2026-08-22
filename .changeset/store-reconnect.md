---
"@soothe/extension": patch
---

Fixed balances (and any other state) freezing in an open popup or extension tab after the browser terminated the extension's background worker (idle, sleep/wake, memory pressure, extension update): the page now reconnects to the background store when the connection drops, reloads the current state and refetches balances and prices right away. Previously the page kept showing its last snapshot until it was reopened.

A balance query stuck in "fetching" for more than 90 seconds (a request that never returned, or a result lost while the background restarted) is now restarted automatically; previously it silently stopped polling and the last value stayed on screen until the page was reopened.
