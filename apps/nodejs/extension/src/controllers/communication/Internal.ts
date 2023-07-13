import browser, { Runtime } from "webextension-polyfill";
import store from "../../redux/store";
import {
  ANSWER_CONNECTION_REQUEST,
  ANSWER_CONNECTION_RESPONSE,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_NEW_ACCOUNT_RESPONSE,
  ANSWER_TRANSFER_REQUEST,
  ANSWER_TRANSFER_RESPONSE,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  INITIALIZE_VAULT_REQUEST,
  INITIALIZE_VAULT_RESPONSE,
  LOCK_VAULT_REQUEST,
  LOCK_VAULT_RESPONSE,
  NEW_ACCOUNT_RESPONSE,
  REVOKE_SESSION_REQUEST,
  REVOKE_SESSION_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNLOCK_VAULT_REQUEST,
  UNLOCK_VAULT_RESPONSE,
} from "../../constants/communication";
import {
  ConnectionRequest,
  NewAccountRequest,
  removeExternalRequest,
  RequestsType,
  resetRequestsState,
  TransferRequest,
} from "../../redux/slices/app";
import {
  AccountReference,
  ExternalAccessRequest,
  OriginReference,
  Permission,
  SerializedAsset,
  SerializedSession,
} from "@poktscan/keyring";
import {
  addNewAccount,
  authorizeExternalSession,
  initVault,
  lockVault,
  revokeSession,
  unlockVault,
} from "../../redux/slices/vault";
import MessageSender = Runtime.MessageSender;

export interface AnswerConnectionRequest {
  type: typeof ANSWER_CONNECTION_REQUEST;
  data: {
    accepted: boolean;
    request: ConnectionRequest;
    canCreateAccounts: boolean;
    idsOfSelectedAccounts: string[];
  } | null;
}

export interface AnswerNewAccountRequest {
  type: typeof ANSWER_NEW_ACCOUNT_REQUEST;
  data: {
    rejected?: boolean;
    accountData: {
      name: string;
      password: string;
      asset: SerializedAsset;
    } | null;
    request?: NewAccountRequest | null;
  };
}

export interface AnswerTransferRequest {
  type: typeof ANSWER_TRANSFER_REQUEST;
  data: {
    rejected?: boolean;
    transferData: {
      from:
        | string
        | {
            address: string;
            password: string;
          };
      asset: SerializedAsset;
      amount: string;
      toAddress: string;
    } | null;
    request?: TransferRequest | null;
  };
}

export interface VaultRequestWithPass<T extends string> {
  type: T;
  data: {
    password;
  };
}

type InitializeVaultRequest = VaultRequestWithPass<
  typeof INITIALIZE_VAULT_REQUEST
>;
type UnlockVaultRequest = VaultRequestWithPass<typeof UNLOCK_VAULT_REQUEST>;

interface LockVaultMessage {
  type: typeof LOCK_VAULT_REQUEST;
}

interface RevokeSessionMessage {
  type: typeof REVOKE_SESSION_REQUEST;
  data: {
    sessionId: string;
  };
}

export type Message =
  | AnswerConnectionRequest
  | AnswerNewAccountRequest
  | AnswerTransferRequest
  | InitializeVaultRequest
  | UnlockVaultRequest
  | LockVaultMessage
  | RevokeSessionMessage;

// Controller to manage the communication between extension views and the background
class InternalCommunicationController {
  constructor() {
    browser.windows.onRemoved.addListener(this.handleOnRemovedWindow);
  }

  async handleOnRemovedWindow(windowId: number) {
    const { requestsWindowId, externalRequests } = store.getState().app;

    if (externalRequests?.length && windowId === requestsWindowId) {
      await Promise.all([
        ...externalRequests.map((request: RequestsType) => {
          let response;

          if (request.type === CONNECTION_REQUEST_MESSAGE) {
            response = {
              type: CONNECTION_RESPONSE_MESSAGE,
              data: {
                accepted: false,
                session: null,
              },
              error: null,
            };
          } else if (request.type === TRANSFER_REQUEST) {
            response = {
              type: TRANSFER_RESPONSE,
              data: {
                rejected: true,
                hash: null,
              },
              error: null,
            };
          } else {
            response = {
              type: NEW_ACCOUNT_RESPONSE,
              data: {
                rejected: true,
                address: null,
              },
              error: null,
            };
          }

          return browser.tabs.sendMessage(request.tabId, response);
        }),
        browser.action.setBadgeText({ text: "" }),
      ]);
    }

    if (windowId === requestsWindowId) {
      await store.dispatch(resetRequestsState());
    }
  }

  async onMessageHandler(message: Message, _: MessageSender) {
    if (message?.type === ANSWER_CONNECTION_REQUEST) {
      return this._answerConnectionRequest(message);
    }

    if (message?.type === ANSWER_NEW_ACCOUNT_REQUEST) {
      return this._answerCreateNewAccount(message);
    }

    if (message?.type === ANSWER_TRANSFER_REQUEST) {
      return this._answerTransferAccount(message);
    }

    if (message?.type === INITIALIZE_VAULT_REQUEST) {
      return this._handleInitializeVault(message.data.password);
    }

    if (message?.type === UNLOCK_VAULT_REQUEST) {
      return this._handleUnlockVault(message.data.password);
    }

    if (message?.type === LOCK_VAULT_REQUEST) {
      return this._handleLockVault();
    }

    if (message?.type === REVOKE_SESSION_REQUEST) {
      return this._handleRevokeSession(message.data.sessionId);
    }
  }

  private async _handleInitializeVault(password: string) {
    await store.dispatch(initVault(password));

    return {
      type: INITIALIZE_VAULT_RESPONSE,
      data: {
        answered: true,
      },
    };
  }

  private async _handleUnlockVault(password: string) {
    const result = await store.dispatch(unlockVault(password));
    const isPasswordWrong = result && "error" in result;

    return {
      type: UNLOCK_VAULT_RESPONSE,
      data: {
        answered: true,
        isPasswordWrong,
      },
    };
  }

  private async _handleLockVault() {
    await store.dispatch(lockVault());

    return {
      type: LOCK_VAULT_RESPONSE,
      data: {
        answered: true,
      },
    };
  }

  private async _handleRevokeSession(sessionId: string) {
    await store.dispatch(revokeSession(sessionId));

    return {
      type: REVOKE_SESSION_RESPONSE,
      data: {
        answered: true,
      },
    };
  }

  private async _answerConnectionRequest(message: AnswerConnectionRequest) {
    const {
      accepted,
      canCreateAccounts,
      idsOfSelectedAccounts = [],
      request,
    } = message?.data || {};
    const { origin, tabId, type } = request;

    const promises: Promise<unknown>[] = [];

    if (!accepted) {
      promises.push(
        browser.tabs.sendMessage(tabId, {
          type: CONNECTION_RESPONSE_MESSAGE,
          data: {
            accepted: false,
            session: null,
          },
          error: null,
        })
      );
    } else {
      const permissions: Permission[] = [];
      const accountReferences: AccountReference[] = [];

      if (canCreateAccounts) {
        permissions.push({
          resource: "account",
          action: "create",
          identities: ["*"],
        });
      }

      if (idsOfSelectedAccounts.length) {
        permissions.push({
          resource: "account",
          action: "read",
          identities: idsOfSelectedAccounts,
        });

        permissions.push({
          resource: "transaction",
          action: "sign",
          identities: idsOfSelectedAccounts,
        });

        const accounts = store.getState().vault.entities.accounts.list;

        const idsOfSelectedAccountsMap = idsOfSelectedAccounts.reduce(
          (acc, id) => ({ ...acc, [id]: true }),
          {}
        );

        for (const account of accounts) {
          if (idsOfSelectedAccountsMap[account.id]) {
            accountReferences.push(AccountReference.deserialize(account));
          }
        }
      }

      const maxAge = 3600;
      const originReference = new OriginReference(origin);
      const requestReference = new ExternalAccessRequest(
        permissions,
        maxAge,
        originReference,
        accountReferences
      );

      const [response, tabs] = await Promise.all([
        await store.dispatch(authorizeExternalSession(requestReference)),
        browser.tabs.query({ url: `${origin}/*` }),
      ]);

      if (response.payload) {
        const session = response.payload as SerializedSession;
        promises.push(
          ...tabs.map((tab) =>
            browser.tabs.sendMessage(tab.id, {
              type: CONNECTION_RESPONSE_MESSAGE,
              data: {
                accepted: true,
                session: {
                  id: session.id,
                  permissions,
                  maxAge,
                  createdAt: session.createdAt,
                },
              },
              error: null,
            })
          )
        );
      }
    }

    promises.push(
      store.dispatch(
        removeExternalRequest({ origin, type })
      ) as unknown as Promise<unknown>
    );

    await Promise.all(promises);

    if (request) {
      await this._updateBadgeText();
    }

    return {
      type: ANSWER_CONNECTION_RESPONSE,
      data: {
        answered: true,
      },
    };
  }

  private async _answerCreateNewAccount(message: AnswerNewAccountRequest) {
    const { rejected, request, accountData } = message?.data;

    let address: string | null = null;

    if (typeof rejected === "boolean" && rejected && request) {
      await Promise.all([
        browser.tabs.sendMessage(request.tabId, {
          type: NEW_ACCOUNT_RESPONSE,
          data: {
            rejected: true,
            address: null,
          },
          error: null,
        }),
        store.dispatch(
          removeExternalRequest({
            origin: request.origin,
            type: request.type,
          })
        ),
      ]);
    } else if (!rejected) {
      try {
        const accountReference = await store
          .dispatch(
            addNewAccount({
              sessionId: request?.sessionId,
              asset: accountData.asset,
              password: accountData.password,
              name: accountData.password,
            })
          )
          .unwrap();

        address = accountReference.address;
      } catch (e) {
        console.log("ERROR creating account:", e);
        // todo: handle error
      }

      if (request) {
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, {
            type: NEW_ACCOUNT_RESPONSE,
            data: {
              rejected: false,
              address,
            },
            error: null,
          }),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: request.type,
            })
          ),
        ]);
      }
    }

    if (request) {
      await this._updateBadgeText();
    }

    return {
      type: ANSWER_NEW_ACCOUNT_RESPONSE,
      data: {
        answered: true,
        address,
      },
    };
  }

  //todo: improve this and the before method
  private async _answerTransferAccount(message: AnswerTransferRequest) {
    const { rejected, request } = message?.data;

    let hash: string | null = null;

    if (typeof rejected === "boolean" && rejected && request) {
      await Promise.all([
        browser.tabs.sendMessage(request.tabId, {
          type: TRANSFER_RESPONSE,
          data: {
            rejected: true,
            hash: null,
          },
          error: null,
        }),
        store.dispatch(
          removeExternalRequest({
            origin: request.origin,
            type: request.type,
          })
        ),
      ]);
    } else if (!rejected) {
      // todo: add send transfer code returning the hash
      hash = "CC9B7E13113EADE99C40B28B28BD84FE1F5B11BAB4F93E1B485CC1E351EE3543";

      if (request) {
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, {
            type: TRANSFER_RESPONSE,
            data: {
              rejected: false,
              hash,
            },
            error: null,
          }),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: request.type,
            })
          ),
        ]);
      }
    }

    if (request) {
      await this._updateBadgeText();
    }

    return {
      type: ANSWER_TRANSFER_RESPONSE,
      data: {
        answered: true,
        hash,
      },
    };
  }

  private async _updateBadgeText() {
    const numberOfRequests = store.getState().app.externalRequests.length;

    const badgeText = numberOfRequests ? `${numberOfRequests}` : "";

    await browser.action
      .setBadgeText({
        text: badgeText,
      })
      .catch();
  }
}

export default InternalCommunicationController;
