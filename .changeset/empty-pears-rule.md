---
"@soothe/extension": minor
---

- Requests are now also displayed in the popup for easier access.
- Snackbars (toasts) now appear at the top when interacting with a request, ensuring action buttons (accept/reject)
  remain accessible.
- Balance fetch failures are now grouped into a single snackbar instead of showing one per failed balance.
- Added an Error Boundary view so users can report issues directly.
- Improved handling of failed transactions in the Migration workflow.
- Introduced a "Report Bug" page for reporting failed operations:
    - Currently implemented only for failed transactions (transactions not sent to the network).
    - Future support is planned for all operations (e.g., create account, import account, etc.).
