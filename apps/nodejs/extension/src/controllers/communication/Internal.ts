import type { Protocol } from "@poktscan/keyring/dist/lib/core/common/Protocol";
import type {
  ExternalConnectionRequest,
  ExternalNewAccountRequest,
  ExternalTransferRequest,
  InternalConnectionResponse,
  InternalNewAccountResponse,
  InternalTransferResponse,
} from "../../types/communication";
import browser, { type Runtime } from "webextension-polyfill";
import {
  AccountExistError,
  ExternalAccessRequest,
  OriginReference,
  PermissionResources,
  PermissionsBuilder,
  PrivateKeyRestoreError,
  SerializedAccountReference,
  SerializedAsset,
  VaultRestoreError,
} from "@poktscan/keyring";
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
  IMPORT_ACCOUNT_REQUEST,
  IMPORT_ACCOUNT_RESPONSE,
  INITIALIZE_VAULT_REQUEST,
  INITIALIZE_VAULT_RESPONSE,
  LOCK_VAULT_REQUEST,
  LOCK_VAULT_RESPONSE,
  NEW_ACCOUNT_RESPONSE,
  PK_ACCOUNT_REQUEST,
  PK_ACCOUNT_RESPONSE,
  REMOVE_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_RESPONSE,
  REVOKE_SESSION_REQUEST,
  REVOKE_SESSION_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNLOCK_VAULT_REQUEST,
  UNLOCK_VAULT_RESPONSE,
  UPDATE_ACCOUNT_REQUEST,
  UPDATE_ACCOUNT_RESPONSE,
} from "../../constants/communication";
import {
  removeExternalRequest,
  RequestsType,
  resetRequestsState,
} from "../../redux/slices/app";
import {
  addNewAccount,
  authorizeExternalSession,
  getPrivateKeyOfAccount,
  importAccount,
  ImportAccountParam,
  initVault,
  lockVault,
  removeAccount,
  revokeSession,
  sendTransfer,
  SerializedTransferOptions,
  unlockVault,
  updateAccount,
} from "../../redux/slices/vault";
import { UnknownError } from "../../errors/communication";

type MessageSender = Runtime.MessageSender;
type UnknownErrorType = typeof UnknownError;
type BaseData = { answered: true };

type BaseResponse<
  T extends string,
  D extends BaseData = BaseData,
  E = UnknownErrorType
> = { type: T; data: D; error: null } | { type: T; data: null; error: E };

export interface AnswerConnectionRequest {
  type: typeof ANSWER_CONNECTION_REQUEST;
  data: {
    accepted: boolean;
    request: ExternalConnectionRequest;
    canListAccounts: boolean;
    canCreateAccounts: boolean;
    canSuggestTransfers: boolean;
  } | null;
}

export type AnswerConnectionResponse = BaseResponse<
  typeof ANSWER_CONNECTION_RESPONSE
>;

export interface AnswerNewAccountRequest {
  type: typeof ANSWER_NEW_ACCOUNT_REQUEST;
  data: {
    rejected?: boolean;
    vaultPassword?: string;
    accountData: {
      name: string;
      password: string;
      asset: SerializedAsset;
    } | null;
    request?: ExternalNewAccountRequest | null;
  };
}

type AnswerNewAccountResponseData = BaseData & {
  address: string;
  accountId: string;
  isPasswordWrong?: boolean;
};

export type AnswerNewAccountResponse = BaseResponse<
  typeof ANSWER_NEW_ACCOUNT_RESPONSE,
  AnswerNewAccountResponseData
>;

export interface AnswerTransferRequest {
  type: typeof ANSWER_TRANSFER_REQUEST;
  data: {
    rejected?: boolean;
    transferData: SerializedTransferOptions<Protocol> | null;
    request?: ExternalTransferRequest | null;
  };
}

type AnswerTransferResponseData = BaseData & {
  hash: string;
  isPasswordWrong?: boolean;
};

export type AnswerTransferResponse = BaseResponse<
  typeof ANSWER_TRANSFER_RESPONSE,
  AnswerTransferResponseData
>;

export interface VaultRequestWithPass<T extends string> {
  type: T;
  data: {
    password: string;
    remember: boolean;
  };
}

export type InitializeVaultRequest = VaultRequestWithPass<
  typeof INITIALIZE_VAULT_REQUEST
>;
export type InitializeVaultResponse = BaseResponse<
  typeof INITIALIZE_VAULT_RESPONSE
>;

export type UnlockVaultRequest = VaultRequestWithPass<
  typeof UNLOCK_VAULT_REQUEST
>;

type UnlockVaultResponseData = BaseData & {
  isPasswordWrong: boolean;
};

export type UnlockVaultResponse = BaseResponse<
  typeof UNLOCK_VAULT_RESPONSE,
  UnlockVaultResponseData
>;

export interface LockVaultMessage {
  type: typeof LOCK_VAULT_REQUEST;
}

export type LockVaultResponse = BaseResponse<typeof LOCK_VAULT_RESPONSE>;

export interface RevokeSessionMessage {
  type: typeof REVOKE_SESSION_REQUEST;
  data: {
    sessionId: string;
  };
}

export type RevokeSessionResponse = BaseResponse<
  typeof REVOKE_SESSION_RESPONSE
>;

export interface UpdateAccountMessage {
  type: typeof UPDATE_ACCOUNT_REQUEST;
  data: {
    vaultPassword?: string;
    id: string;
    name: string;
  };
}

export interface UpdateAccountResponse {
  type: typeof UPDATE_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    isPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface RemoveAccountMessage {
  type: typeof REMOVE_ACCOUNT_REQUEST;
  data: {
    serializedAccount: SerializedAccountReference;
    vaultPassword: string;
  };
}

export interface RemoveAccountResponse {
  type: typeof REMOVE_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    isPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface ImportAccountMessage {
  type: typeof IMPORT_ACCOUNT_REQUEST;
  data: ImportAccountParam;
}

export interface ImportAccountResponse {
  type: typeof IMPORT_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    accountId: string;
    isPasswordWrong?: boolean;
    accountAlreadyExists?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface PrivateKeyAccountMessage {
  type: typeof PK_ACCOUNT_REQUEST;
  data: {
    account: SerializedAccountReference;
    vaultPassword: string;
    accountPassword: string;
  };
}

export interface PrivateKeyAccountResponse {
  type: typeof PK_ACCOUNT_RESPONSE;
  data: {
    answered: true;
    privateKey: string | null;
    isAccountPasswordWrong?: boolean;
    isVaultPasswordWrong?: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export type Message =
  | AnswerConnectionRequest
  | AnswerNewAccountRequest
  | AnswerTransferRequest
  | InitializeVaultRequest
  | UnlockVaultRequest
  | LockVaultMessage
  | RevokeSessionMessage
  | UpdateAccountMessage
  | RemoveAccountMessage
  | ImportAccountMessage
  | PrivateKeyAccountMessage;

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
          let response:
            | InternalTransferResponse
            | InternalConnectionResponse
            | InternalNewAccountResponse;

          if (request.type === CONNECTION_REQUEST_MESSAGE) {
            response = {
              type: CONNECTION_RESPONSE_MESSAGE,
              data: {
                accepted: false,
                session: null,
              },
              error: null,
            } as InternalConnectionResponse;
          } else if (request.type === TRANSFER_REQUEST) {
            response = {
              type: TRANSFER_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalTransferResponse;
          } else {
            response = {
              type: NEW_ACCOUNT_RESPONSE,
              data: {
                rejected: true,
                address: null,
                protocol: null,
              },
              error: null,
            } as InternalNewAccountResponse;
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
      return this._handleInitializeVault(message.data);
    }

    if (message?.type === UNLOCK_VAULT_REQUEST) {
      return this._handleUnlockVault(message.data);
    }

    if (message?.type === LOCK_VAULT_REQUEST) {
      return this._handleLockVault();
    }

    if (message?.type === REVOKE_SESSION_REQUEST) {
      return this._handleRevokeSession(message.data.sessionId);
    }

    if (message?.type === UPDATE_ACCOUNT_REQUEST) {
      return this._handleUpdateAccount(message);
    }

    if (message?.type === REMOVE_ACCOUNT_REQUEST) {
      return this._handleRemoveAccount(message);
    }

    if (message?.type === IMPORT_ACCOUNT_REQUEST) {
      return this._handleImportAccount(message);
    }

    if (message?.type === PK_ACCOUNT_REQUEST) {
      return this._getPrivateKeyOfAccount(message);
    }
  }

  private async _handleInitializeVault(
    data: InitializeVaultRequest["data"]
  ): Promise<InitializeVaultResponse> {
    try {
      await store.dispatch(initVault(data)).unwrap();

      return {
        type: INITIALIZE_VAULT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: INITIALIZE_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleUnlockVault(
    data: UnlockVaultRequest["data"]
  ): Promise<UnlockVaultResponse> {
    try {
      await store.dispatch(unlockVault(data)).unwrap();

      return {
        type: UNLOCK_VAULT_RESPONSE,
        data: {
          answered: true,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreError.name) {
        return {
          type: UNLOCK_VAULT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }

      return {
        type: UNLOCK_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleLockVault(): Promise<LockVaultResponse> {
    try {
      await store.dispatch(lockVault());

      return {
        type: LOCK_VAULT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: LOCK_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleRevokeSession(
    sessionId: string
  ): Promise<RevokeSessionResponse> {
    try {
      await store
        .dispatch(revokeSession({ sessionId, external: false }))
        .unwrap();

      return {
        type: REVOKE_SESSION_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: REVOKE_SESSION_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerConnectionRequest(
    message: AnswerConnectionRequest
  ): Promise<AnswerConnectionResponse> {
    try {
      const {
        accepted,
        canCreateAccounts,
        canSuggestTransfers,
        canListAccounts,
        request,
      } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalConnectionResponse;

      if (!accepted) {
        responseToProxy = {
          type: CONNECTION_RESPONSE_MESSAGE,
          data: {
            accepted: false,
            session: null,
          },
          error: null,
        };

        promises.push(browser.tabs.sendMessage(tabId, responseToProxy));
      } else {
        const permissionBuilder = new PermissionsBuilder();

        if (canCreateAccounts) {
          permissionBuilder
            .forResource(PermissionResources.account)
            .allow("create")
            .onAny();
        }

        if (canListAccounts) {
          permissionBuilder
            .forResource(PermissionResources.account)
            .allow("read")
            .onAny();
        }

        if (canSuggestTransfers) {
          permissionBuilder
            .forResource(PermissionResources.transaction)
            .allow("send")
            .onAny();
        }

        const permissions = permissionBuilder.build();
        const maxAge = 3600;
        const originReference = new OriginReference(origin);
        const requestReference = new ExternalAccessRequest(
          permissions,
          maxAge,
          originReference
        );

        const [session, tabs] = await Promise.all([
          store.dispatch(authorizeExternalSession(requestReference)).unwrap(),
          browser.tabs.query({ url: `${origin}/*` }),
        ]);

        if (session) {
          responseToProxy = {
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
          };
          promises.push(
            ...tabs.map((tab) =>
              browser.tabs.sendMessage(tab.id, responseToProxy)
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
        error: null,
      };
    } catch (e) {
      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: CONNECTION_RESPONSE_MESSAGE,
            data: null,
            error: UnknownError,
          })
          .catch();
      }

      return {
        type: ANSWER_CONNECTION_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerCreateNewAccount(
    message: AnswerNewAccountRequest
  ): Promise<AnswerNewAccountResponse> {
    try {
      const { rejected, request, accountData, vaultPassword } =
        message?.data || {};
      let address: string | null = null,
        accountId: string = null;
      let response: InternalNewAccountResponse;

      if (typeof rejected === "boolean" && rejected && request) {
        response = {
          type: NEW_ACCOUNT_RESPONSE,
          data: {
            rejected: true,
            address: null,
            protocol: null,
          },
          error: null,
        };
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, response),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: request.type,
            })
          ),
        ]);
      } else if (!rejected) {
        const responseVault = await store
          .dispatch(
            addNewAccount({
              sessionId: request?.sessionId,
              asset: accountData.asset,
              password: accountData.password,
              name: accountData.name,
              vaultPassword,
            })
          )
          .unwrap();

        address = responseVault.accountReference.address;
        accountId = responseVault.accountReference.id;

        if (request) {
          response = {
            type: NEW_ACCOUNT_RESPONSE,
            data: {
              rejected: false,
              address,
              protocol: accountData.asset.protocol,
            },
            error: null,
          };
          await Promise.all([
            browser.tabs.sendMessage(request.tabId, response),
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
          accountId,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreError.name) {
        return {
          type: ANSWER_NEW_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
            address: null,
            accountId: null,
          },
          error: null,
        };
      }

      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: NEW_ACCOUNT_RESPONSE,
            data: null,
            error: UnknownError,
          })
          .catch();
      }

      return {
        type: ANSWER_NEW_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  //todo: improve this and the before method
  private async _answerTransferAccount(
    message: AnswerTransferRequest
  ): Promise<AnswerTransferResponse> {
    try {
      const { rejected, request, transferData } = message?.data || {};

      let hash: string | null = null;
      let response: InternalTransferResponse;

      if (typeof rejected === "boolean" && rejected && request) {
        response = {
          type: TRANSFER_RESPONSE,
          data: {
            rejected: true,
            hash: null,
            protocol: null,
          },
          error: null,
        };
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, response),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: request.type,
            })
          ),
        ]);
      } else if (!rejected) {
        hash = await store.dispatch(sendTransfer(transferData)).unwrap();

        if (request) {
          response = {
            type: TRANSFER_RESPONSE,
            data: {
              rejected: false,
              hash,
              protocol: transferData.from.asset.protocol,
            },
            error: null,
          };
          await Promise.all([
            browser.tabs.sendMessage(request.tabId, response),
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
        error: null,
      };
    } catch (error) {
      if (error?.name === PrivateKeyRestoreError.name) {
        return {
          type: ANSWER_TRANSFER_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
            hash: null,
          },
          error: null,
        };
      }

      const tabId = message?.data?.request?.tabId;

      if (tabId) {
        await browser.tabs
          .sendMessage(tabId, {
            type: TRANSFER_RESPONSE,
            data: null,
            error: UnknownError,
          })
          .catch();
      }

      return {
        type: ANSWER_TRANSFER_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleUpdateAccount(
    message: UpdateAccountMessage
  ): Promise<UpdateAccountResponse> {
    try {
      await store.dispatch(updateAccount(message.data)).unwrap();

      return {
        type: UPDATE_ACCOUNT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreError.name) {
        return {
          type: UPDATE_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }
      return {
        type: UPDATE_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleRemoveAccount(
    message: RemoveAccountMessage
  ): Promise<RemoveAccountResponse> {
    try {
      await store.dispatch(removeAccount(message.data)).unwrap();

      return {
        type: REMOVE_ACCOUNT_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreError.name) {
        return {
          type: REMOVE_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }
      return {
        type: REMOVE_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleImportAccount(
    message: ImportAccountMessage
  ): Promise<ImportAccountResponse> {
    try {
      const account = await store
        .dispatch(importAccount(message.data))
        .unwrap();

      return {
        type: IMPORT_ACCOUNT_RESPONSE,
        data: {
          answered: true,
          accountId: account.id,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreError.name) {
        return {
          type: IMPORT_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
            accountId: null,
          },
          error: null,
        };
      }

      if (error?.name === AccountExistError.name) {
        return {
          type: IMPORT_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            accountAlreadyExists: true,
            accountId: null,
          },
          error: null,
        };
      }
      return {
        type: IMPORT_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _getPrivateKeyOfAccount({
    data,
  }: PrivateKeyAccountMessage): Promise<PrivateKeyAccountResponse> {
    try {
      const privateKey = await store
        .dispatch(getPrivateKeyOfAccount(data))
        .unwrap();

      return {
        type: PK_ACCOUNT_RESPONSE,
        data: {
          privateKey,
          answered: true,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreError.name) {
        return {
          type: PK_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isVaultPasswordWrong: true,
            privateKey: null,
          },
          error: null,
        };
      }

      if (error?.name === PrivateKeyRestoreError.name) {
        return {
          type: PK_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            isAccountPasswordWrong: true,
            privateKey: null,
          },
          error: null,
        };
      }
      return {
        type: PK_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _updateBadgeText() {
    try {
      const numberOfRequests = store.getState().app.externalRequests.length;

      const badgeText = numberOfRequests ? `${numberOfRequests}` : "";

      await browser.action
        .setBadgeText({
          text: badgeText,
        })
        .catch();
    } catch (e) {}
  }
}

export default InternalCommunicationController;
