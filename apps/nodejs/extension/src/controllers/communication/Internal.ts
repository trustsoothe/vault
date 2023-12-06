import type {
  ExternalConnectionRequest,
  ExternalNewAccountRequest,
  ExternalSwitchChainRequest,
  ExternalSwitchChainResponse,
  InternalConnectionResponse,
  InternalNewAccountResponse,
  InternalTransferResponse,
} from "../../types/communication";
import browser, { type Runtime } from "webextension-polyfill";
import {
  AccountExistErrorName,
  EthereumNetworkFee,
  ExternalAccessRequest,
  OriginReference,
  PermissionResources,
  PermissionsBuilder,
  PocketNetworkFee,
  PrivateKeyRestoreErrorName,
  SerializedAccountReference,
  SupportedProtocols,
  VaultRestoreErrorName,
} from "@poktscan/keyring";
import store from "../../redux/store";
import {
  ACCOUNT_BALANCE_REQUEST,
  ACCOUNT_BALANCE_RESPONSE,
  ANSWER_CONNECTION_REQUEST,
  ANSWER_CONNECTION_RESPONSE,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_NEW_ACCOUNT_RESPONSE,
  ANSWER_SWITCH_CHAIN_REQUEST,
  ANSWER_SWITCH_CHAIN_RESPONSE,
  ANSWER_TRANSACTION_REQUEST,
  ANSWER_TRANSFER_REQUEST,
  ANSWER_TRANSFER_RESPONSE,
  CHECK_PERMISSION_FOR_SESSION_REQUEST,
  CHECK_PERMISSION_FOR_SESSION_RESPONSE,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  IMPORT_ACCOUNT_REQUEST,
  IMPORT_ACCOUNT_RESPONSE,
  INITIALIZE_VAULT_REQUEST,
  INITIALIZE_VAULT_RESPONSE,
  LOCK_VAULT_REQUEST,
  LOCK_VAULT_RESPONSE,
  NETWORK_FEE_REQUEST,
  NETWORK_FEE_RESPONSE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  PK_ACCOUNT_REQUEST,
  PK_ACCOUNT_RESPONSE,
  REMOVE_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_RESPONSE,
  REVOKE_EXTERNAL_SESSIONS_REQUEST,
  REVOKE_EXTERNAL_SESSIONS_RESPONSE,
  REVOKE_SESSION_REQUEST,
  REVOKE_SESSION_RESPONSE,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNLOCK_VAULT_REQUEST,
  UNLOCK_VAULT_RESPONSE,
  UPDATE_ACCOUNT_REQUEST,
  UPDATE_ACCOUNT_RESPONSE,
} from "../../constants/communication";
import {
  changeSelectedNetwork,
  IAsset,
  increaseErrorOfNetwork,
  removeExternalRequest,
  RequestsType,
  resetRequestsState,
} from "../../redux/slices/app";
import { initVault, lockVault, unlockVault } from "../../redux/slices/vault";
import {
  addNewAccount,
  getPrivateKeyOfAccount,
  importAccount,
  ImportAccountParam,
  removeAccount,
  sendTransfer,
  SendTransactionParams, sendRawTransaction,
  updateAccount,
} from "../../redux/slices/vault/account";
import {
  authorizeExternalSession,
  revokeAllExternalSessions,
  revokeSession,
} from "../../redux/slices/vault/session";
import { OperationRejected, UnknownError } from "../../errors/communication";
import {
  getAccountBalance,
  GetAccountBalanceParam,
} from "../../redux/slices/app/network";
import { getFee, NetworkForOperations } from "../../utils/networkOperations";
import { getVault } from "../../utils";

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
    selectedAccounts: string[];
    protocol: SupportedProtocols;
  } | null;
}

export type AnswerConnectionResponse = BaseResponse<
  typeof ANSWER_CONNECTION_RESPONSE
>;

export type AnswerSwitchChainResponse = BaseResponse<
  typeof ANSWER_SWITCH_CHAIN_RESPONSE
>;

export interface AnswerNewAccountRequest {
  type: typeof ANSWER_NEW_ACCOUNT_REQUEST;
  data: {
    rejected?: boolean;
    vaultPassword?: string;
    accountData: {
      name: string;
      password: string;
      protocol: SupportedProtocols;
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
    transferData: SendTransactionParams | null;
    request?: {
      tabId: number;
      origin: string;
      requestId: string;
      protocol: SupportedProtocols;
    }  | null;
  };
}

export interface AnswerTransactionRequest {
  type: typeof ANSWER_TRANSACTION_REQUEST;
  data: {
    rejected?: boolean;
    transferData: SendTransactionParams | null;
    request?: {
      tabId: number;
      origin: string;
      requestId: string;
      protocol: SupportedProtocols;
    } | null;
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

export interface RevokeExternalSessionsMessage {
  type: typeof REVOKE_EXTERNAL_SESSIONS_REQUEST;
}

export type RevokeSessionResponse = BaseResponse<
  typeof REVOKE_SESSION_RESPONSE
>;

export type RevokeExternalSessionsResponse = BaseResponse<
  typeof REVOKE_EXTERNAL_SESSIONS_RESPONSE
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

export interface AccountBalanceMessage {
  type: typeof ACCOUNT_BALANCE_REQUEST;
  data: GetAccountBalanceParam;
}

export interface AccountBalanceResponse {
  type: typeof ACCOUNT_BALANCE_RESPONSE;
  data: {
    answered: true;
    balance: number;
  } | null;
  error: UnknownErrorType | null;
}

export interface NetworkFeeMessage {
  type: typeof NETWORK_FEE_REQUEST;
  data: {
    toAddress?: string;
    asset?: IAsset;
    protocol: SupportedProtocols;
    chainId: string;
    data?: string;
    from?: string;
  };
}

export interface NetworkFeeResponse {
  type: typeof NETWORK_FEE_RESPONSE;
  data: {
    answered: true;
    networkFee: PocketNetworkFee | EthereumNetworkFee;
  } | null;
  error: UnknownErrorType | null;
}

export interface CheckPermissionForSessionMessage {
  type: typeof CHECK_PERMISSION_FOR_SESSION_REQUEST;
  data: {
    sessionId: string;
    resource: string;
    action: string;
    ids?: string[];
  };
}

export interface CheckPermissionForSessionResponse {
  type: typeof CHECK_PERMISSION_FOR_SESSION_RESPONSE;
  data: {
    sessionIsValid: boolean;
  } | null;
  error: UnknownErrorType | null;
}

export interface AnswerSwitchChainRequest {
  type: typeof ANSWER_SWITCH_CHAIN_REQUEST;
  data: {
    accepted: boolean;
    request: ExternalSwitchChainRequest;
  } | null;
}

export type Message =
  | AnswerConnectionRequest
  | AnswerNewAccountRequest
  | AnswerTransferRequest
  | AnswerTransactionRequest
  | InitializeVaultRequest
  | UnlockVaultRequest
  | LockVaultMessage
  | RevokeSessionMessage
  | UpdateAccountMessage
  | RemoveAccountMessage
  | ImportAccountMessage
  | PrivateKeyAccountMessage
  | RevokeExternalSessionsMessage
  | AccountBalanceMessage
  | NetworkFeeMessage
  | CheckPermissionForSessionMessage
  | AnswerSwitchChainRequest;

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
            | InternalNewAccountResponse
            | ExternalSwitchChainResponse;

          if (request.type === CONNECTION_REQUEST_MESSAGE) {
            response = {
              requestId: request.requestId,
              type: CONNECTION_RESPONSE_MESSAGE,
              data: {
                accepted: false,
                session: null,
              },
              error: null,
            } as InternalConnectionResponse;
          } else if (request.type === TRANSFER_REQUEST) {
            response = {
              requestId: request.requestId,
              type: TRANSFER_RESPONSE,
              data: {
                rejected: true,
                hash: null,
                protocol: null,
              },
              error: null,
            } as InternalTransferResponse;
          } else if (request.type === NEW_ACCOUNT_REQUEST) {
            response = {
              requestId: request.requestId,
              type: NEW_ACCOUNT_RESPONSE,
              data: {
                rejected: true,
                address: null,
                protocol: null,
              },
              error: null,
            } as InternalNewAccountResponse;
          } else {
            response = {
              requestId: request.requestId,
              type: SWITCH_CHAIN_RESPONSE,
              data: null,
              error: OperationRejected,
            } as ExternalSwitchChainResponse;
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

    if (message?.type === ANSWER_TRANSACTION_REQUEST) {
      return this._answerTransactionAccount(message);
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

    if (message?.type === REVOKE_EXTERNAL_SESSIONS_REQUEST) {
      return this._handleRevokeExternalSessions();
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

    if (message?.type === ACCOUNT_BALANCE_REQUEST) {
      return this._getAccountBalance(message);
    }

    if (message?.type === NETWORK_FEE_REQUEST) {
      return this._getNetworkFee(message);
    }

    if (message?.type === CHECK_PERMISSION_FOR_SESSION_REQUEST) {
      return this._checkPermissionsForSession(message);
    }

    if (message?.type === ANSWER_SWITCH_CHAIN_REQUEST) {
      return this._answerSwitchChainRequest(message);
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
      if (error?.name === VaultRestoreErrorName) {
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

  private async _handleRevokeExternalSessions(): Promise<RevokeExternalSessionsResponse> {
    try {
      await store.dispatch(revokeAllExternalSessions()).unwrap();

      return {
        type: REVOKE_EXTERNAL_SESSIONS_RESPONSE,
        data: {
          answered: true,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: REVOKE_EXTERNAL_SESSIONS_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerConnectionRequest(
    message: AnswerConnectionRequest
  ): Promise<AnswerConnectionResponse> {
    try {
      const { accepted, selectedAccounts, request, protocol } =
        message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalConnectionResponse;

      if (!accepted) {
        responseToProxy = {
          type: CONNECTION_RESPONSE_MESSAGE,
          data: {
            accepted: false,
            addresses: null,
            session: null,
            protocol,
          },
          requestId: request?.requestId,
          error: null,
        };

        promises.push(browser.tabs.sendMessage(tabId, responseToProxy));
      } else {
        const permissionBuilder = new PermissionsBuilder();

        permissionBuilder
          .forResource(PermissionResources.account)
          .allow("read")
          .on(...selectedAccounts)
          .forResource(PermissionResources.transaction)
          .allow("send")
          .on(...selectedAccounts);

        const permissions = permissionBuilder.build();
        const maxAge = 3600;
        const originReference = new OriginReference(origin);
        const requestReference = new ExternalAccessRequest(
          permissions,
          maxAge,
          originReference
        );

        const [session, tabs] = await Promise.all([
          store
            .dispatch(
              authorizeExternalSession({
                request: requestReference,
                protocol,
              })
            )
            .unwrap(),
          browser.tabs.query({ url: `${origin}/*` }),
        ]);

        if (session) {
          const currentSelectedAccountForProtocol =
            store.getState().app.selectedAccountByProtocol[protocol];

          const selectedAccountOnApp = selectedAccounts.find(
            (address) => address === currentSelectedAccountForProtocol
          );

          let addresses: string[];

          if (selectedAccountOnApp) {
            addresses = [
              selectedAccountOnApp,
              ...selectedAccounts.filter(
                (address) => address !== selectedAccountOnApp
              ),
            ];
          } else {
            addresses = selectedAccounts;
          }

          responseToProxy = {
            type: CONNECTION_RESPONSE_MESSAGE,
            requestId: request?.requestId,
            data: {
              accepted: true,
              addresses,
              session: {
                id: session.id,
                maxAge,
                createdAt: session.createdAt,
              },
              protocol,
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
          removeExternalRequest({ origin, type, protocol: request.protocol })
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

  private async _answerSwitchChainRequest(
    message: AnswerSwitchChainRequest
  ): Promise<AnswerSwitchChainResponse> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: ExternalSwitchChainResponse;

      if (!accepted) {
        responseToProxy = {
          requestId: request?.requestId,
          type: SWITCH_CHAIN_RESPONSE,
          data: null,
          error: OperationRejected,
        };

        promises.push(browser.tabs.sendMessage(tabId, responseToProxy));
      } else {
        await store
          .dispatch(
            changeSelectedNetwork({
              network: request.protocol,
              chainId: request.chainId,
            })
          )
          .unwrap();

        responseToProxy = {
          requestId: request?.requestId,
          type: SWITCH_CHAIN_RESPONSE,
          data: null,
          error: null,
        };
      }

      promises.push(
        browser.tabs.sendMessage(tabId, responseToProxy),
        store.dispatch(
          removeExternalRequest({ origin, type, protocol: request.protocol })
        ) as unknown as Promise<unknown>
      );

      await Promise.all(promises);

      if (request) {
        await this._updateBadgeText();
      }

      return {
        type: ANSWER_SWITCH_CHAIN_RESPONSE,
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
            type: SWITCH_CHAIN_RESPONSE,
            data: null,
            error: UnknownError,
          } as ExternalSwitchChainResponse)
          .catch();
      }

      return {
        type: ANSWER_SWITCH_CHAIN_RESPONSE,
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
          requestId: request?.requestId,
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
              protocol: accountData.protocol,
            })
          ),
        ]);
      } else if (!rejected) {
        const responseVault = await store
          .dispatch(
            addNewAccount({
              sessionId: request?.sessionId,
              protocol: accountData.protocol,
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
            requestId: request?.requestId,
            data: {
              rejected: false,
              address,
              protocol: accountData.protocol,
            },
            error: null,
          };
          await Promise.all([
            browser.tabs.sendMessage(request.tabId, response),
            store.dispatch(
              removeExternalRequest({
                origin: request.origin,
                type: request.type,
                protocol: accountData.protocol,
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
      if (error?.name === VaultRestoreErrorName) {
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
          requestId: request?.requestId,
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
              type: TRANSFER_REQUEST,
              protocol: request.protocol,
            })
          ),
        ]);
      } else if (!rejected) {
        debugger;
        hash = await store.dispatch(sendTransfer(transferData)).unwrap();

        if (request) {
          response = {
            type: TRANSFER_RESPONSE,
            requestId: request?.requestId,
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
                type: TRANSFER_REQUEST,
                protocol: request.protocol,
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
      if (error?.name === PrivateKeyRestoreErrorName) {
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

      console.log("SEND TRANSFER ERROR:", error);

      return {
        type: ANSWER_TRANSFER_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerTransactionAccount(
    message: AnswerTransactionRequest
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
            protocol: request.protocol
          },
          error: null,
        };
        await Promise.all([
          browser.tabs.sendMessage(request.tabId, response),
          store.dispatch(
            removeExternalRequest({
              origin: request.origin,
              type: TRANSFER_REQUEST,
              protocol: request.protocol
            })
          ),
        ]);
      } else if (!rejected) {
        hash = await store.dispatch(sendRawTransaction(transferData)).unwrap();

        if (request) {
          response = {
            type: TRANSFER_RESPONSE,
            data: {
              rejected: false,
              hash,
              protocol: transferData.network.protocol,
            },
            error: null,
          };
          await Promise.all([
            browser.tabs.sendMessage(request.tabId, response),
            store.dispatch(
              removeExternalRequest({
                origin: request.origin,
                type: TRANSFER_REQUEST,
                protocol: request.protocol
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
      if (error?.name === PrivateKeyRestoreErrorName) {
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

      console.log("SEND TRANSFER ERROR:", error);

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
      if (error?.name === VaultRestoreErrorName) {
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
      if (error?.name === VaultRestoreErrorName) {
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
      if (error?.name === VaultRestoreErrorName) {
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

      if (error?.name === AccountExistErrorName) {
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
      if (error?.name === VaultRestoreErrorName) {
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

      if (error?.name === PrivateKeyRestoreErrorName) {
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

  private async _getAccountBalance({
    data,
  }: AccountBalanceMessage): Promise<AccountBalanceResponse> {
    try {
      const result = await store.dispatch(getAccountBalance(data)).unwrap();

      return {
        type: ACCOUNT_BALANCE_RESPONSE,
        data: {
          answered: true,
          balance: result.amount,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: ACCOUNT_BALANCE_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _getNetworkFee({
    data: { protocol, chainId, toAddress, asset, data, from },
  }: NetworkFeeMessage): Promise<NetworkFeeResponse> {
    try {
      const networks = this._getNetworks();
      const errorsPreferredNetwork =
        store.getState().app.errorsPreferredNetwork;
      const result = await getFee({
        protocol,
        chainId: chainId as any,
        networks,
        errorsPreferredNetwork,
        options:
          protocol === SupportedProtocols.Ethereum
            ? {
                to: toAddress,
                protocol,
                asset: asset ? { ...asset, chainID: asset.chainId } : undefined,
                data,
                from,
              }
            : undefined,
      });

      if (result.networksWithErrors?.length) {
        for (const networkId of result.networksWithErrors) {
          await store.dispatch(increaseErrorOfNetwork(networkId));
        }
      }

      return {
        type: NETWORK_FEE_RESPONSE,
        data: {
          answered: true,
          networkFee: result.fee,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: NETWORK_FEE_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private _getNetworks(): NetworkForOperations[] {
    const {
      app: { networks, customRpcs },
    } = store.getState();

    return [
      ...networks.map(
        (network) =>
          ({
            protocol: network.protocol,
            id: network.id,
            chainID: network.chainId,
            isDefault: true,
            isPreferred: false,
            rpcUrl: network.rpcUrl,
          } as NetworkForOperations)
      ),
      ...customRpcs.map(
        (rpc) =>
          ({
            protocol: rpc.protocol,
            id: rpc.id,
            chainID: rpc.chainId,
            isDefault: false,
            isPreferred: rpc.isPreferred,
            rpcUrl: rpc.url,
          } as NetworkForOperations)
      ),
    ];
  }

  private async _checkPermissionsForSession(
    message: CheckPermissionForSessionMessage
  ): Promise<CheckPermissionForSessionResponse> {
    try {
      const vault = getVault();

      let sessionIsValid: boolean;

      try {
        const { sessionId, resource, ids, action } = message?.data || {};
        await vault.validateSessionForPermissions(
          sessionId,
          resource,
          action,
          ids
        );
        sessionIsValid = true;
      } catch (e) {
        sessionIsValid = false;
      }

      return {
        type: CHECK_PERMISSION_FOR_SESSION_RESPONSE,
        data: {
          sessionIsValid,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: CHECK_PERMISSION_FOR_SESSION_RESPONSE,
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
