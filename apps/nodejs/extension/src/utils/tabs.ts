import browser, { Tabs } from "webextension-polyfill";

/**
 * Sends a message to the content script of every given tab without waiting
 * for an answer.
 *
 * Chrome never settles `tabs.sendMessage` for a tab it has frozen (Memory
 * Saver / background tab freezing): the message is only delivered once the
 * tab is thawed. Awaiting the broadcast therefore blocks the caller for as
 * long as any frozen tab exists, which is what made switching between chains
 * of the same protocol hang. Tabs without our content script (chrome://,
 * extension pages...) reject immediately and are ignored.
 */
export function broadcastToTabs(
  tabs: Array<Tabs.Tab>,
  message: unknown
): void {
  for (const tab of tabs) {
    if (typeof tab.id !== "number") continue;

    browser.tabs.sendMessage(tab.id, message).catch(() => {});
  }
}
