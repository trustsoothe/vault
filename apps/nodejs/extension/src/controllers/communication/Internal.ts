import type { AppRequests, InternalRequests } from "../../types/communications";
import type {
  AnswerTransferReq,
  AnswerTransferRes,
  InternalTransferRes,
} from "../../types/communications/transfer";
import type {
  AnswerConnectionReq,
  AnswerConnectionRes,
  InternalConnectionRes,
} from "../../types/communications/connection";
import type {
  AnswerSwitchChainReq,
  AnswerSwitchChainRes,
  ExternalSwitchChainRes,
  InternalSwitchChainRes,
} from "../../types/communications/switchChain";
import type {
  AnswerSignedTypedDataReq,
  AnswerSignedTypedDataRes,
  ExternalSignTypedDataRes,
  InternalSignedTypedDataRes,
} from "../../types/communications/signTypedData";
import type {
  AnswerPersonalSignReq,
  AnswerPersonalSignRes,
  InternalPersonalSignRes,
} from "../../types/communications/personalSign";
import type {
  CheckPermissionForSessionReq,
  CheckPermissionForSessionRes,
  ExportVaultReq,
  ExportVaultRes,
  ImportAccountReq,
  ImportAccountRes,
  ImportVaultReq,
  ImportVaultRes,
  InitializeVaultReq,
  InitializeVaultRes,
  LockVaultRes,
  PrivateKeyAccountReq,
  PrivateKeyAccountRes,
  RemoveAccountReq,
  RemoveAccountRes,
  RevokeExternalSessionsRes,
  RevokeSessionRes,
  ShouldExportVaultRes,
  UnlockVaultReq,
  UnlockVaultRes,
  UpdateAccountReq,
  UpdateAccountRes,
} from "../../types/communications/vault";
import type {
  AnswerNewAccountReq,
  AnswerNewAccountRes,
} from "../../types/communications/newAccount";
import type {
  AccountBalanceReq,
  AccountBalanceRes,
} from "../../types/communications/balance";
import type {
  NetworkFeeReq,
  NetworkFeeRes,
  SetRequirePasswordForOptsReq,
  SetRequirePasswordForOptsRes,
} from "../../types/communications/app";
import type { ICommunicationController } from "../../types";
import browser, { type Runtime } from "webextension-polyfill";
import {
  AccountExistErrorName,
  AccountReference,
  EthereumNetworkProtocolService,
  ExternalAccessRequest,
  OriginReference,
  Passphrase,
  PermissionResources,
  PermissionsBuilder,
  PrivateKeyRestoreErrorName,
  SupportedProtocols,
  VaultRestoreErrorName,
} from "@poktscan/keyring";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import store from "../../redux/store";
import {
  ACCOUNT_BALANCE_REQUEST,
  ACCOUNT_BALANCE_RESPONSE,
  ANSWER_CONNECTION_REQUEST,
  ANSWER_CONNECTION_RESPONSE,
  ANSWER_NEW_ACCOUNT_REQUEST,
  ANSWER_NEW_ACCOUNT_RESPONSE,
  ANSWER_PERSONAL_SIGN_REQUEST,
  ANSWER_PERSONAL_SIGN_RESPONSE,
  ANSWER_SIGNED_TYPED_DATA_REQUEST,
  ANSWER_SIGNED_TYPED_DATA_RESPONSE,
  ANSWER_SWITCH_CHAIN_REQUEST,
  ANSWER_SWITCH_CHAIN_RESPONSE,
  ANSWER_TRANSFER_REQUEST,
  ANSWER_TRANSFER_RESPONSE,
  CHECK_PERMISSION_FOR_SESSION_REQUEST,
  CHECK_PERMISSION_FOR_SESSION_RESPONSE,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  EXPORT_VAULT_REQUEST,
  EXPORT_VAULT_RESPONSE,
  IMPORT_ACCOUNT_REQUEST,
  IMPORT_ACCOUNT_RESPONSE,
  IMPORT_VAULT_REQUEST,
  IMPORT_VAULT_RESPONSE,
  INITIALIZE_VAULT_REQUEST,
  INITIALIZE_VAULT_RESPONSE,
  LOCK_VAULT_REQUEST,
  LOCK_VAULT_RESPONSE,
  NETWORK_FEE_REQUEST,
  NETWORK_FEE_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
  PK_ACCOUNT_REQUEST,
  PK_ACCOUNT_RESPONSE,
  REMOVE_ACCOUNT_REQUEST,
  REMOVE_ACCOUNT_RESPONSE,
  REVOKE_EXTERNAL_SESSIONS_REQUEST,
  REVOKE_EXTERNAL_SESSIONS_RESPONSE,
  REVOKE_SESSION_REQUEST,
  REVOKE_SESSION_RESPONSE,
  SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST,
  SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
  SHOULD_EXPORT_VAULT_REQUEST,
  SHOULD_EXPORT_VAULT_RESPONSE,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNLOCK_VAULT_REQUEST,
  UNLOCK_VAULT_RESPONSE,
  UPDATE_ACCOUNT_REQUEST,
  UPDATE_ACCOUNT_RESPONSE,
} from "../../constants/communication";
import {
  changeActiveTab,
  changeSelectedNetwork,
  increaseErrorOfNetwork,
  removeExternalRequest,
  resetRequestsState,
  setRequirePasswordSensitiveOpts,
  setSessionMaxAgeData,
} from "../../redux/slices/app";
import {
  getVaultPassword,
  initVault,
  lockVault,
  unlockVault,
} from "../../redux/slices/vault";
import {
  addNewAccount,
  getPrivateKeyOfAccount,
  importAccount,
  removeAccount,
  sendTransfer,
  updateAccount,
} from "../../redux/slices/vault/account";
import {
  authorizeExternalSession,
  revokeAllExternalSessions,
  revokeSession,
} from "../../redux/slices/vault/session";
import { OperationRejected, UnknownError } from "../../errors/communication";
import { getAccountBalance } from "../../redux/slices/app/network";
import { getFee, NetworkForOperations } from "../../utils/networkOperations";
import { getVault } from "../../utils";
import {
  exportVault,
  hashString,
  importVault,
} from "../../redux/slices/vault/backup";
import { sign } from "web3-eth-accounts";

type MessageSender = Runtime.MessageSender;

const ethService = new EthereumNetworkProtocolService(
  new WebEncryptionService()
);

const mapMessageType: Record<InternalRequests["type"], true> = {
  [ANSWER_CONNECTION_REQUEST]: true,
  [ANSWER_NEW_ACCOUNT_REQUEST]: true,
  [ANSWER_TRANSFER_REQUEST]: true,
  [INITIALIZE_VAULT_REQUEST]: true,
  [UNLOCK_VAULT_REQUEST]: true,
  [LOCK_VAULT_REQUEST]: true,
  [REVOKE_EXTERNAL_SESSIONS_REQUEST]: true,
  [REVOKE_SESSION_REQUEST]: true,
  [UPDATE_ACCOUNT_REQUEST]: true,
  [REMOVE_ACCOUNT_REQUEST]: true,
  [IMPORT_ACCOUNT_REQUEST]: true,
  [PK_ACCOUNT_REQUEST]: true,
  [ACCOUNT_BALANCE_REQUEST]: true,
  [NETWORK_FEE_REQUEST]: true,
  [CHECK_PERMISSION_FOR_SESSION_REQUEST]: true,
  [ANSWER_SWITCH_CHAIN_REQUEST]: true,
  [ANSWER_SIGNED_TYPED_DATA_REQUEST]: true,
  [ANSWER_PERSONAL_SIGN_REQUEST]: true,
  [EXPORT_VAULT_REQUEST]: true,
  [SHOULD_EXPORT_VAULT_REQUEST]: true,
  [IMPORT_VAULT_REQUEST]: true,
  [SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST]: true,
};

// Controller to manage the communication between extension views and the background
class InternalCommunicationController implements ICommunicationController {
  constructor() {
    browser.windows.onRemoved.addListener(this._handleOnRemovedWindow);
  }

  messageForController(messageType: string) {
    return mapMessageType[messageType] || false;
  }

  async onMessageHandler(message: InternalRequests, _: MessageSender) {
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

    if (message?.type === ANSWER_SIGNED_TYPED_DATA_REQUEST) {
      return this._answerSignedTypedDataRequest(message);
    }

    if (message?.type === ANSWER_PERSONAL_SIGN_REQUEST) {
      return this._answerPersonalSignRequest(message);
    }

    if (message?.type === EXPORT_VAULT_REQUEST) {
      return this._exportVault(message);
    }

    if (message?.type === SHOULD_EXPORT_VAULT_REQUEST) {
      return this._shouldExportVault();
    }

    if (message?.type === IMPORT_VAULT_REQUEST) {
      return this._importVault(message);
    }

    if (message?.type === SET_REQUIRE_PASSWORD_FOR_OPTS_REQUEST) {
      return this._setRequirePasswordForOpts(message);
    }
  }

  private async _handleOnRemovedWindow(windowId: number) {
    const { requestsWindowId, externalRequests } = store.getState().app;

    if (externalRequests?.length && windowId === requestsWindowId) {
      await Promise.all([
        ...externalRequests.map((request: AppRequests) => {
          let response:
            | InternalTransferRes
            | InternalConnectionRes
            | InternalSwitchChainRes
            | InternalSignedTypedDataRes
            | InternalPersonalSignRes;

          if (request.type === CONNECTION_REQUEST_MESSAGE) {
            response = {
              requestId: request.requestId,
              type: CONNECTION_RESPONSE_MESSAGE,
              data: {
                accepted: false,
                session: null,
              },
              error: null,
            } as InternalConnectionRes;
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
            } as InternalTransferRes;
          } else if (request.type === SIGN_TYPED_DATA_REQUEST) {
            response = {
              requestId: request.requestId,
              type: SIGN_TYPED_DATA_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalSignedTypedDataRes;
          } else if (request.type === PERSONAL_SIGN_REQUEST) {
            response = {
              requestId: request.requestId,
              type: PERSONAL_SIGN_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalPersonalSignRes;
          } else {
            response = {
              requestId: request.requestId,
              type: SWITCH_CHAIN_RESPONSE,
              data: null,
              error: OperationRejected,
            } as InternalSwitchChainRes;
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

  private async _handleInitializeVault(
    data: InitializeVaultReq["data"]
  ): Promise<InitializeVaultRes> {
    try {
      await store
        .dispatch(
          setRequirePasswordSensitiveOpts(data.requirePasswordForSensitiveOpts)
        )
        .unwrap();
      await store
        .dispatch(
          setSessionMaxAgeData({
            maxAgeInSecs: data.sessionsMaxAge.maxAge,
            enabled: data.sessionsMaxAge.enabled,
          })
        )
        .unwrap();
      await store.dispatch(initVault(data.password)).unwrap();
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
    data: UnlockVaultReq["data"]
  ): Promise<UnlockVaultRes> {
    try {
      await store.dispatch(unlockVault(data.password)).unwrap();

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

  private async _handleLockVault(): Promise<LockVaultRes> {
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
  ): Promise<RevokeSessionRes> {
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

  private async _handleRevokeExternalSessions(): Promise<RevokeExternalSessionsRes> {
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
    message: AnswerConnectionReq
  ): Promise<AnswerConnectionRes> {
    try {
      const { accepted, selectedAccounts, request, protocol } =
        message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalConnectionRes;

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
        const { sessionsMaxAge } = store.getState().app;
        const maxAge = sessionsMaxAge.enabled
          ? sessionsMaxAge.maxAgeInSecs || 3600
          : 0;
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
      const activeTabs = await browser.tabs.query({ active: true });
      if (activeTabs.length) {
        const activeTab = activeTabs[0];

        await store.dispatch(
          changeActiveTab({
            favIconUrl: activeTab.favIconUrl,
            url: activeTab.url,
            id: activeTab.id,
          })
        );
      }

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
    message: AnswerSwitchChainReq
  ): Promise<AnswerSwitchChainRes> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: ExternalSwitchChainRes;

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
          } as InternalSwitchChainRes)
          .catch();
      }

      return {
        type: ANSWER_SWITCH_CHAIN_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerSignedTypedDataRequest(
    message: AnswerSignedTypedDataReq
  ): Promise<AnswerSignedTypedDataRes> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalSignedTypedDataRes;

      if (!accepted) {
        responseToProxy = {
          requestId: request?.requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          data: null,
          error: OperationRejected,
        };
      } else {
        const pk = await this._getAccountPrivateKey(
          request.address,
          request.protocol,
          request.requestId
        );

        const sign = await ethService.signTypedData({
          data: request.data,
          privateKey: pk.replace("0x", ""),
        });

        responseToProxy = {
          requestId: request?.requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          data: {
            sign,
          },
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
      await this._updateBadgeText();

      return {
        type: ANSWER_SIGNED_TYPED_DATA_RESPONSE,
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
            type: SIGN_TYPED_DATA_RESPONSE,
            data: null,
            error: UnknownError,
          } as ExternalSignTypedDataRes)
          .catch();
      }

      return {
        type: ANSWER_SIGNED_TYPED_DATA_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerPersonalSignRequest(
    message: AnswerPersonalSignReq
  ): Promise<AnswerPersonalSignRes> {
    try {
      const { accepted, request } = message?.data || {};
      const { origin, tabId, type } = request;

      const promises: Promise<unknown>[] = [];
      let responseToProxy: InternalPersonalSignRes;

      if (!accepted) {
        responseToProxy = {
          requestId: request?.requestId,
          type: PERSONAL_SIGN_RESPONSE,
          data: null,
          error: OperationRejected,
        };
      } else {
        const pk = await this._getAccountPrivateKey(
          request.address,
          request.protocol,
          request.requestId
        );

        // todo: replace with sign of EthereumNetworkProtocolService
        const signResult = sign(request.challenge, pk).signature;

        responseToProxy = {
          requestId: request?.requestId,
          type: PERSONAL_SIGN_RESPONSE,
          data: {
            sign: signResult,
          },
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
      await this._updateBadgeText();

      return {
        type: ANSWER_PERSONAL_SIGN_RESPONSE,
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
            type: PERSONAL_SIGN_RESPONSE,
            data: null,
            error: UnknownError,
          } as InternalPersonalSignRes)
          .catch();
      }

      return {
        type: ANSWER_PERSONAL_SIGN_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerCreateNewAccount(
    message: AnswerNewAccountReq
  ): Promise<AnswerNewAccountRes> {
    try {
      const { rejected, accountData } = message?.data || {};
      let address: string | null = null,
        accountId: string = null;

      if (!rejected) {
        const responseVault = await store
          .dispatch(
            addNewAccount({
              protocol: accountData.protocol,
              name: accountData.name,
            })
          )
          .unwrap();

        address = responseVault.accountReference.address;
        accountId = responseVault.accountReference.id;
      }

      return {
        type: ANSWER_NEW_ACCOUNT_RESPONSE,
        data: {
          answered: true,
          address,
          accountId,
        },
        error: null,
      };
    } catch (error) {
      if (error?.name === VaultRestoreErrorName) {
        return {
          type: ANSWER_NEW_ACCOUNT_RESPONSE,
          data: {
            answered: true,
            address: null,
            accountId: null,
          },
          error: null,
        };
      }

      return {
        type: ANSWER_NEW_ACCOUNT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _answerTransferAccount(
    message: AnswerTransferReq
  ): Promise<AnswerTransferRes> {
    try {
      const { rejected, request, transferData } = message?.data || {};

      let hash: string | null = null;
      let response: InternalTransferRes;

      if (typeof rejected === "boolean" && rejected && request) {
        response = {
          type: TRANSFER_RESPONSE,
          requestId: request.requestId,
          data: {
            rejected: true,
            hash: null,
            protocol: request.protocol,
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
        const {
          app: { requirePasswordForSensitiveOpts },
          vault: { vaultSession },
        } = store.getState();

        if (requirePasswordForSensitiveOpts) {
          const vaultPassword = await getVaultPassword(vaultSession.id);

          if (vaultPassword !== transferData.from.passphrase) {
            return {
              type: ANSWER_TRANSFER_RESPONSE,
              data: {
                answered: true,
                hash: null,
                isPasswordWrong: true,
              },
              error: null,
            };
          }
        }

        hash = await store.dispatch(sendTransfer(transferData)).unwrap();

        if (request) {
          response = {
            type: TRANSFER_RESPONSE,
            requestId: request.requestId,
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

  private async _handleUpdateAccount(
    message: UpdateAccountReq
  ): Promise<UpdateAccountRes> {
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
    message: RemoveAccountReq
  ): Promise<RemoveAccountRes> {
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
    message: ImportAccountReq
  ): Promise<ImportAccountRes> {
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
  }: PrivateKeyAccountReq): Promise<PrivateKeyAccountRes> {
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
  }: AccountBalanceReq): Promise<AccountBalanceRes> {
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
    data: { protocol, chainId, toAddress, asset, ...optionProps },
  }: NetworkFeeReq): Promise<NetworkFeeRes> {
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
                ...optionProps,
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
    message: CheckPermissionForSessionReq
  ): Promise<CheckPermissionForSessionRes> {
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

  private async _exportVault(message: ExportVaultReq): Promise<ExportVaultRes> {
    try {
      const { encryptionPassword, currentVaultPassword } = message.data;
      const response = await store
        .dispatch(
          exportVault({
            encryptionPassword,
            vaultPassword: currentVaultPassword,
          })
        )
        .unwrap();

      return {
        type: EXPORT_VAULT_RESPONSE,
        data: {
          vault: response.exportedVault,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (e) {
      if (e?.name === VaultRestoreErrorName) {
        return {
          type: EXPORT_VAULT_RESPONSE,
          data: {
            isPasswordWrong: true,
            vault: null,
          },
          error: null,
        };
      }

      return {
        type: EXPORT_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _shouldExportVault(): Promise<ShouldExportVaultRes> {
    try {
      const { backupData, dateWhenInitialized } = store.getState().vault;
      const date = backupData?.lastDate || dateWhenInitialized || 0;
      const oneWeekInMs = 604800000;

      let shouldExportVault = false;

      try {
        const vault = getVault();
        const vaultContent = await vault
          .getEncryptedVault()
          .then((value) => value.contents);
        const vaultContentHashed = await hashString(
          JSON.stringify(vaultContent)
        );

        shouldExportVault =
          vaultContentHashed !== backupData?.vaultHash &&
          date + oneWeekInMs < Date.now();
      } catch (e) {}

      return {
        type: SHOULD_EXPORT_VAULT_RESPONSE,
        data: {
          hasVaultBeenExported: !!backupData,
          shouldExportVault,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: SHOULD_EXPORT_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _importVault(message: ImportVaultReq): Promise<ImportVaultRes> {
    try {
      await store.dispatch(importVault(message.data)).unwrap();

      return {
        type: IMPORT_VAULT_RESPONSE,
        data: {
          answered: true,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (e) {
      if (e?.name === VaultRestoreErrorName) {
        return {
          type: IMPORT_VAULT_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }

      return {
        type: IMPORT_VAULT_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _setRequirePasswordForOpts(
    message: SetRequirePasswordForOptsReq
  ): Promise<SetRequirePasswordForOptsRes> {
    try {
      const { id } = store.getState().vault.vaultSession;
      const password = await getVaultPassword(id);

      const { vaultPassword, enabled } = message.data;

      if (password !== vaultPassword) {
        return {
          type: SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
          data: {
            answered: true,
            isPasswordWrong: true,
          },
          error: null,
        };
      }

      await store.dispatch(setRequirePasswordSensitiveOpts(enabled)).unwrap();

      return {
        type: SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
        data: {
          answered: true,
          isPasswordWrong: false,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: SET_REQUIRE_PASSWORD_FOR_OPTS_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _getAccountPrivateKey(
    address: string,
    protocol: SupportedProtocols,
    sessionId: string
  ) {
    const vault = getVault();
    const vaultState = store.getState().vault;
    const vaultSessionId = vaultState.vaultSession.id;
    const serializedAccount = vaultState.accounts.find(
      (account) => account.protocol === protocol && account.address === address
    );
    const accountReference = AccountReference.deserialize(serializedAccount);
    const pass = await getVaultPassword(vaultSessionId);
    const passphrase = new Passphrase(pass);
    return vault.getAccountPrivateKey(sessionId, passphrase, accountReference);
  }
}

export default InternalCommunicationController;
