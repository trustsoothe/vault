---
"@soothe/extension": patch
---

Fixed two UI failures that only appear in production builds.

Popper (used by every MUI tooltip and popper-based surface) reads `globalThis.ShadowRoot` when the anchor element has no parent node, which happens when the anchor is detached from the DOM while the popper still updates. LavaMoat's scuttling mode did not list `ShadowRoot` as an exception, so that read threw `LavaMoat - property "ShadowRoot" of globalThis is inaccessible under scuttling mode` and broke the copy-address button. `ShadowRoot` is now an exception; the LavaMoat policy already granted it to Popper's module. The copy-address button also clears its "Copied" timeout on unmount, so it no longer updates a detached tooltip.

Dialogs now move focus off the element that opened them before MUI marks the rest of the app `aria-hidden`, and restore that focus once the dialog closes. Chrome refuses to apply `aria-hidden` to a subtree that still contains the focused element, which left the dialog's background exposed to assistive technology.
