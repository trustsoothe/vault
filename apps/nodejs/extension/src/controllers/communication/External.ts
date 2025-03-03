import type {
  AppRequests,
  ExternalRequests,
  RequestExistsError,
} from "../../types/communications";
import type {
  ExternalConnectionReq,
  ExternalConnectionRes,
} from "../../types/communications/connection";
import type {
  ExternalSwitchChainReq,
  ExternalSwitchChainRes,
} from "../../types/communications/switchChain";
import type {
  ExternalIsSessionValidReq,
  ExternalIsSessionValidRes,
} from "../../types/communications/sessionIsValid";
import type {
  ExternalTransferReq,
  ExternalTransferRes,
} from "../../types/communications/transfer";
import type {
  ExternalSignTypedDataReq,
  ExternalSignTypedDataRes,
} from "../../types/communications/signTypedData";
import type {
  ExternalPersonalSignReq,
  ExternalPersonalSignRes,
} from "../../types/communications/personalSign";
import type {
  BaseErrors,
  BaseExternalRequestBodyWithSession,
} from "../../types/communications/common";
import type {
  ExternalListAccountsReq,
  ExternalListAccountsRes,
} from "../../types/communications/listAccounts";
import type {
  ExternalBalanceReq,
  ExternalBalanceRes,
} from "../../types/communications/balance";
import type {
  ExternalSelectedChainReq,
  ExternalSelectedChainRes,
} from "../../types/communications/selectedChain";
import type {
  ExternalGetPoktTxReq,
  ExternalGetPoktTxRes,
} from "../../types/communications/getPoktTransaction";
import type { ICommunicationController } from "../../types";
import { toWei } from "web3-utils";
import browser, { type Runtime } from "webextension-polyfill";
import { WebEncryptionService } from "@soothe/vault-encryption-web";
import {
  INetwork,
  PocketNetworkProtocolService,
  SupportedProtocols,
  VaultIsLockedErrorName,
} from "@soothe/vault";
import {
  propertyIsRequired,
  RequestChangeParamExists,
  RequestConnectionExists,
  RequestDaoTransferExists,
  RequestPersonalSignExists,
  RequestPublicKeyExists,
  RequestSignedTypedDataExists,
  RequestStakeAppExists,
  RequestStakeNodeExists,
  RequestSwitchChainExists,
  RequestTransferAppExists,
  RequestTransferExists,
  RequestUnjailNodeExists,
  RequestUnstakeAppExists,
  RequestUnstakeNodeExists,
  RequestUpgradeExists,
  SessionIdNotPresented,
  UnauthorizedError,
  UnknownError,
  UnrecognizedChainId,
} from "../../errors/communication";
import store from "../../redux/store";
import {
  addExternalRequest,
  addWindow,
  getBlockedSites,
} from "../../redux/slices/app";
import {
  CHANGE_PARAM_REQUEST,
  CHANGE_PARAM_RESPONSE,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DAO_TRANSFER_REQUEST,
  DAO_TRANSFER_RESPONSE,
  DISCONNECT_RESPONSE,
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
  PUBLIC_KEY_REQUEST,
  PUBLIC_KEY_RESPONSE,
  REQUEST_BEING_HANDLED,
  SELECTED_CHAIN_REQUEST,
  SELECTED_CHAIN_RESPONSE,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  STAKE_APP_REQUEST,
  STAKE_APP_RESPONSE,
  STAKE_NODE_REQUEST,
  STAKE_NODE_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_APP_REQUEST,
  TRANSFER_APP_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNJAIL_NODE_REQUEST,
  UNJAIL_NODE_RESPONSE,
  UNSTAKE_APP_REQUEST,
  UNSTAKE_APP_RESPONSE,
  UNSTAKE_NODE_REQUEST,
  UNSTAKE_NODE_RESPONSE,
  UPGRADE_REQUEST,
  UPGRADE_RESPONSE,
} from "../../constants/communication";
import { getVault, isHex, returnExtensionErr } from "../../utils";
import { HEIGHT, WIDTH } from "../../constants/ui";
import {
  getAddressFromPublicKey,
  isValidAddress,
} from "../../utils/networkOperations";
import { balanceApi } from "../../redux/slices/balance";
import { ExternalResponse } from "../../types/communications/transactions";
import {
  ExternalPublicKeyReq,
  ExternalPublicKeyRes,
} from "../../types/communications/publicKey";

type MessageSender = Runtime.MessageSender;

const mapMessageType: Record<ExternalRequests["type"], true> = {
  [CONNECTION_REQUEST_MESSAGE]: true,
  [IS_SESSION_VALID_REQUEST]: true,
  [TRANSFER_REQUEST]: true,
  [SWITCH_CHAIN_REQUEST]: true,
  [LIST_ACCOUNTS_REQUEST]: true,
  [EXTERNAL_ACCOUNT_BALANCE_REQUEST]: true,
  [SELECTED_CHAIN_REQUEST]: true,
  [GET_POKT_TRANSACTION_REQUEST]: true,
  [SIGN_TYPED_DATA_REQUEST]: true,
  [PERSONAL_SIGN_REQUEST]: true,
  [STAKE_NODE_REQUEST]: true,
  [UNSTAKE_NODE_REQUEST]: true,
  [UNJAIL_NODE_REQUEST]: true,
  [STAKE_APP_REQUEST]: true,
  [TRANSFER_APP_REQUEST]: true,
  [UNSTAKE_APP_REQUEST]: true,
  [CHANGE_PARAM_REQUEST]: true,
  [DAO_TRANSFER_REQUEST]: true,
  [PUBLIC_KEY_REQUEST]: true,
  [UPGRADE_REQUEST]: true,
};

const errorReqExistByResType = {
  [CONNECTION_RESPONSE_MESSAGE]: RequestConnectionExists,
  [SWITCH_CHAIN_RESPONSE]: RequestSwitchChainExists,
  [TRANSFER_RESPONSE]: RequestTransferExists,
  [SIGN_TYPED_DATA_RESPONSE]: RequestSignedTypedDataExists,
  [PERSONAL_SIGN_RESPONSE]: RequestPersonalSignExists,
  [STAKE_NODE_RESPONSE]: RequestStakeNodeExists,
  [UNSTAKE_NODE_RESPONSE]: RequestUnstakeNodeExists,
  [UNJAIL_NODE_RESPONSE]: RequestUnjailNodeExists,
  [STAKE_APP_RESPONSE]: RequestStakeAppExists,
  [TRANSFER_APP_RESPONSE]: RequestTransferAppExists,
  [UNSTAKE_APP_RESPONSE]: RequestUnstakeAppExists,
  [CHANGE_PARAM_RESPONSE]: RequestChangeParamExists,
  [DAO_TRANSFER_RESPONSE]: RequestDaoTransferExists,
  [PUBLIC_KEY_RESPONSE]: RequestPublicKeyExists,
  [UPGRADE_RESPONSE]: RequestUpgradeExists,
};

const ExtensionVaultInstance = getVault();

// Controller to manage the communication between the background and the content script.
// The content script is the one sending messages and the background response the messages.
// This is intended to be used in the background.
class ExternalCommunicationController implements ICommunicationController {
  messageForController(messageType: string) {
    return mapMessageType[messageType] || false;
  }

  public async onMessageHandler(
    message: ExternalRequests,
    sender: MessageSender
  ) {
    if (message.type === CONNECTION_REQUEST_MESSAGE) {
      const response = await this._handleConnectionRequest(message, sender);

      if (response && response.type === CONNECTION_RESPONSE_MESSAGE) {
        return response;
      }
      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message.type === IS_SESSION_VALID_REQUEST) {
      const response = await this._isSessionValid(message);

      if (response?.type === IS_SESSION_VALID_RESPONSE) {
        return response;
      }
    }

    if (message?.type === TRANSFER_REQUEST) {
      const response = await this._handleTransferRequest(message, sender);

      if (response && response?.type === TRANSFER_RESPONSE) {
        return response;
      }
      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message?.type === SWITCH_CHAIN_REQUEST) {
      const response = await this._handleSwitchChainRequest(message, sender);

      if (response && response?.type === SWITCH_CHAIN_RESPONSE) {
        return response;
      }
      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message?.type === LIST_ACCOUNTS_REQUEST) {
      const response = await this._handleListAccountsRequest(message);

      if (response?.type === LIST_ACCOUNTS_RESPONSE) {
        return response;
      }
    }

    if (message?.type === EXTERNAL_ACCOUNT_BALANCE_REQUEST) {
      const response = await this._handleBalanceRequest(message);

      if (response?.type === EXTERNAL_ACCOUNT_BALANCE_RESPONSE) {
        return response;
      }
    }

    if (message?.type === SELECTED_CHAIN_REQUEST) {
      const response = await this._handleGetSelectedChain(message);

      if (response?.type === SELECTED_CHAIN_RESPONSE) {
        return response;
      }
    }

    if (message?.type === GET_POKT_TRANSACTION_REQUEST) {
      const response = await this._getPoktTx(message);

      if (response?.type === GET_POKT_TRANSACTION_RESPONSE) {
        return response;
      }
    }

    if (message?.type === SIGN_TYPED_DATA_REQUEST) {
      const response = await this._handleSignTypedDataRequest(message, sender);

      if (response && response.type === SIGN_TYPED_DATA_RESPONSE) {
        return response;
      }

      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message?.type === PERSONAL_SIGN_REQUEST) {
      const response = await this._handlePersonalSignRequest(message, sender);

      if (response && response.type === PERSONAL_SIGN_RESPONSE) {
        return response;
      }

      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message?.type === PUBLIC_KEY_REQUEST) {
      const response = await this._handleGetPublicKey(message, sender);

      if (response && response.type === PUBLIC_KEY_RESPONSE) {
        return response;
      }

      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message?.type === STAKE_NODE_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        STAKE_NODE_RESPONSE,
        async (message) => {
          let nodeAddress = message.data.transactionData.address;

          if (message.data.transactionData.operatorPublicKey) {
            nodeAddress = await getAddressFromPublicKey(
              message.data.transactionData.operatorPublicKey
            );
          }
          return {
            nodeAddress,
          };
        }
      );

      if (response && response.type === STAKE_NODE_RESPONSE) {
        return response;
      }

      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message?.type === UNSTAKE_NODE_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        UNSTAKE_NODE_RESPONSE
      );

      if (response && response.type === UNSTAKE_NODE_RESPONSE) {
        return response;
      }

      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
    }

    if (message?.type === UNJAIL_NODE_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        UNJAIL_NODE_RESPONSE
      );

      if (response && response.type === UNJAIL_NODE_RESPONSE) {
        return response;
      }
    }

    if (message?.type === STAKE_APP_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        STAKE_APP_RESPONSE
      );

      if (response && response.type === STAKE_APP_RESPONSE) {
        return response;
      }
    }

    if (message?.type === TRANSFER_APP_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        TRANSFER_APP_RESPONSE
      );

      if (response && response.type === TRANSFER_APP_RESPONSE) {
        return response;
      }
    }

    if (message?.type === UNSTAKE_APP_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        UNSTAKE_APP_RESPONSE
      );

      if (response && response.type === UNSTAKE_APP_RESPONSE) {
        return response;
      }
    }

    if (message?.type === CHANGE_PARAM_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        CHANGE_PARAM_RESPONSE
      );

      if (response && response.type === CHANGE_PARAM_RESPONSE) {
        return response;
      }
    }

    if (message?.type === DAO_TRANSFER_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        DAO_TRANSFER_RESPONSE
      );

      if (response && response.type === DAO_TRANSFER_RESPONSE) {
        return response;
      }
    }

    if (message?.type === UPGRADE_REQUEST) {
      const response = await this._handlePoktTxRequest(
        message,
        sender,
        UPGRADE_RESPONSE
      );

      if (response && response.type === UPGRADE_RESPONSE) {
        return response;
      }
    }
  }

  private async _handleConnectionRequest(
    message: ExternalConnectionReq,
    sender: MessageSender
  ): Promise<ExternalConnectionRes> {
    try {
      const { origin, faviconUrl, protocol } = message?.data || {};

      return this._addExternalRequest(
        {
          type: CONNECTION_REQUEST_MESSAGE,
          origin,
          faviconUrl,
          tabId: sender.tab.id,
          protocol,
          requestId: message?.requestId,
        },
        CONNECTION_RESPONSE_MESSAGE
      );
    } catch (e) {
      return {
        type: CONNECTION_RESPONSE_MESSAGE,
        data: null,
        error: UnknownError,
        requestId: message?.requestId,
      };
    }
  }

  private async _handleSwitchChainRequest(
    message: ExternalSwitchChainReq,
    sender: MessageSender
  ): Promise<ExternalSwitchChainRes> {
    try {
      const { origin, faviconUrl, protocol, chainId } = message?.data || {};

      const state = store.getState();
      const currentSelectedChain = state.app.selectedChainByProtocol[protocol];

      let chainIdParsed = chainId;

      if (
        protocol === SupportedProtocols.Ethereum &&
        chainId.startsWith("0x") &&
        isHex(chainId.substring(2))
      ) {
        chainIdParsed = parseInt(chainId.substring(2), 16).toString();
      }

      if (currentSelectedChain === chainIdParsed) {
        return {
          type: SWITCH_CHAIN_RESPONSE,
          data: null,
          error: null,
          requestId: message?.requestId,
        };
      }

      const networkExists = state.app.networks.some(
        (network) =>
          network.chainId === chainIdParsed && network.protocol === protocol
      );

      if (!networkExists) {
        return {
          type: SWITCH_CHAIN_RESPONSE,
          data: null,
          error: UnrecognizedChainId,
          requestId: message?.requestId,
        };
      }

      return this._addExternalRequest(
        {
          type: SWITCH_CHAIN_REQUEST,
          origin,
          faviconUrl,
          tabId: sender.tab.id,
          protocol,
          chainId: chainIdParsed,
          requestId: message?.requestId,
        },
        SWITCH_CHAIN_RESPONSE
      );
    } catch (e) {
      return {
        type: SWITCH_CHAIN_RESPONSE,
        data: null,
        error: UnknownError,
        requestId: message?.requestId,
      };
    }
  }

  private async _isSessionValid(
    message: ExternalIsSessionValidReq
  ): Promise<ExternalIsSessionValidRes> {
    try {
      const sessionId = message?.data?.sessionId;

      if (!sessionId) {
        return {
          type: IS_SESSION_VALID_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
        };
      }

      const checkOriginResponse = await this._checkOriginIsBlocked(
        message?.data?.origin,
        IS_SESSION_VALID_RESPONSE
      );

      if (checkOriginResponse) {
        return checkOriginResponse;
      }

      const isValid = await ExtensionVaultInstance.isSessionValid(sessionId);

      return {
        type: IS_SESSION_VALID_RESPONSE,
        error: null,
        data: {
          isValid,
        },
      };
    } catch (e) {
      return {
        type: IS_SESSION_VALID_RESPONSE,
        data: null,
        error: UnknownError,
      };
    }
  }

  private async _handleTransferRequest(
    message: ExternalTransferReq,
    sender: MessageSender
  ): Promise<ExternalTransferRes> {
    try {
      const {
        sessionId,
        protocol,
        transferData: { from },
      } = message?.data || {};

      if (!sessionId) {
        return {
          type: TRANSFER_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
          requestId: message?.requestId,
        };
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "transaction",
          "send",
          [from]
        );
      } catch (error) {
        return {
          requestId: message?.requestId,
          ...returnExtensionErr(error, TRANSFER_RESPONSE),
        };
      }

      const chainId = store
        .getState()
        .app.selectedChainByProtocol[protocol].toString();

      return this._addExternalRequest(
        {
          type: TRANSFER_REQUEST,
          tabId: sender.tab.id,
          protocol,
          requestId: message?.requestId,
          ...message.data,
          transferData: {
            ...message.data?.transferData,
            chainId,
          },
        },
        TRANSFER_RESPONSE
      );
    } catch (e) {
      return {
        type: TRANSFER_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _handlePoktTxRequest<
    EReq extends {
      type: string;
      requestId: string;
      data: BaseExternalRequestBodyWithSession & {
        transactionData;
      };
    },
    TRes extends string,
    ERes extends ExternalResponse<TRes>
  >(
    message: EReq,
    sender: MessageSender,
    responseType: TRes,
    addData?: (
      message: EReq
    ) => Promise<Partial<EReq["data"]["transactionData"]>>
  ): Promise<ERes> {
    try {
      const {
        sessionId,
        protocol,
        transactionData: { address },
      } = message?.data || {};

      if (!sessionId) {
        return {
          type: responseType,
          error: SessionIdNotPresented,
          data: null,
          requestId: message?.requestId,
        } as ERes;
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "transaction",
          "send",
          [address]
        );
      } catch (error) {
        return {
          requestId: message?.requestId,
          ...returnExtensionErr(error, responseType),
        } as ERes;
      }

      const chainId = store
        .getState()
        .app.selectedChainByProtocol[protocol].toString();

      return this._addExternalRequest(
        {
          // @ts-ignore
          type: message.type,
          tabId: sender.tab.id,
          protocol,
          requestId: message?.requestId,
          ...message.data,
          transactionData: {
            ...message.data?.transactionData,
            chainId,
            ...(addData && (await addData(message))),
          },
        },
        responseType
      ) as unknown as ERes;
    } catch (e) {
      return {
        type: responseType,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      } as ERes;
    }
  }

  private async _handleSignTypedDataRequest(
    message: ExternalSignTypedDataReq,
    sender: MessageSender
  ): Promise<ExternalSignTypedDataRes> {
    try {
      const { sessionId, address, protocol, data } = message.data;
      if (!sessionId) {
        return {
          type: SIGN_TYPED_DATA_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
          requestId: message?.requestId,
        };
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "account",
          "read",
          [address]
        );
      } catch (error) {
        return {
          requestId: message?.requestId,
          ...returnExtensionErr(error, SIGN_TYPED_DATA_RESPONSE),
        };
      }

      const { selectedChainByProtocol, networks } = store.getState().app;

      const chainId =
        data.domain.chainId?.toString() ||
        selectedChainByProtocol[protocol].toString();

      if (
        !networks.some(
          (network) =>
            network.protocol === protocol && network.chainId === chainId
        )
      ) {
        return {
          type: SIGN_TYPED_DATA_RESPONSE,
          error: UnrecognizedChainId,
          data: null,
          requestId: message?.requestId,
        };
      }

      return this._addExternalRequest(
        {
          type: SIGN_TYPED_DATA_REQUEST,
          tabId: sender.tab.id,
          data: message.data.data,
          origin: message.data.origin,
          faviconUrl: message.data.faviconUrl,
          protocol: message.data.protocol,
          address: message.data.address,
          requestId: message.requestId,
          sessionId: message.data.sessionId,
          chainId,
        },
        SIGN_TYPED_DATA_RESPONSE
      );
    } catch (e) {
      return {
        type: SIGN_TYPED_DATA_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _handlePersonalSignRequest(
    message: ExternalPersonalSignReq,
    sender: MessageSender
  ): Promise<ExternalPersonalSignRes> {
    try {
      const { sessionId, address } = message.data;
      if (!sessionId) {
        return {
          type: PERSONAL_SIGN_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
          requestId: message?.requestId,
        };
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "account",
          "read",
          [address]
        );
      } catch (error) {
        return {
          requestId: message?.requestId,
          ...returnExtensionErr(error, PERSONAL_SIGN_RESPONSE),
        };
      }

      return this._addExternalRequest(
        {
          type: PERSONAL_SIGN_REQUEST,
          tabId: sender.tab.id,
          challenge: message.data.challenge,
          origin: message.data.origin,
          faviconUrl: message.data.faviconUrl,
          protocol: message.data.protocol,
          address: message.data.address,
          requestId: message.requestId,
          sessionId: message.data.sessionId,
        },
        PERSONAL_SIGN_RESPONSE
      );
    } catch (e) {
      return {
        type: PERSONAL_SIGN_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _addExternalRequest<
    T extends
      | typeof CONNECTION_RESPONSE_MESSAGE
      | typeof TRANSFER_RESPONSE
      | typeof SWITCH_CHAIN_RESPONSE
      | typeof SIGN_TYPED_DATA_RESPONSE
      | typeof PERSONAL_SIGN_RESPONSE
      | typeof STAKE_NODE_RESPONSE
      | typeof UNSTAKE_NODE_RESPONSE
      | typeof PUBLIC_KEY_RESPONSE
  >(
    request: AppRequests,
    responseMessage: T
  ): Promise<{
    type: T;
    error: BaseErrors | RequestExistsError<T>;
    data: null;
    requestId: string;
  } | void> {
    let requestWasAdded = false;
    try {
      const checkOriginResponse = await this._checkOriginIsBlocked(
        request.origin,
        responseMessage
      );

      if (checkOriginResponse) {
        return { ...checkOriginResponse, requestId: request.requestId };
      }

      const { externalRequests, requestsWindowId } = store.getState().app;

      const pendingRequestWindow = externalRequests.find(
        (item) =>
          item.origin === request.origin &&
          item.type === request.type &&
          item.protocol === request.protocol
      );

      if (pendingRequestWindow) {
        return {
          type: responseMessage,
          error: errorReqExistByResType[
            responseMessage
          ] as unknown as RequestExistsError<T>,
          data: null,
          requestId: request?.requestId,
        };
      } else {
        await store.dispatch(addExternalRequest(request));

        if (!requestsWindowId) {
          const windowCreated = await browser.windows.create({
            url: "home.html?view=request",
            type: "popup",
            height: HEIGHT,
            width: WIDTH,
          });

          await store.dispatch(addWindow(windowCreated.id));
        }

        requestWasAdded = true;

        await browser.action.setBadgeText({
          text: `${externalRequests.length + 1}`,
        });
      }
    } catch (e) {
      if (!requestWasAdded) {
        return {
          type: responseMessage,
          data: null,
          error: UnknownError,
          requestId: request?.requestId,
        };
      }
    }
  }

  private async _handleGetPublicKey(
    message: ExternalPublicKeyReq,
    sender: MessageSender
  ): Promise<ExternalPublicKeyRes> {
    try {
      const { origin, address, sessionId } = message?.data || {};

      if (!sessionId) {
        return {
          type: PUBLIC_KEY_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
          requestId: message?.requestId,
        };
      }

      const checkOriginResponse = await this._checkOriginIsBlocked(
        origin,
        PUBLIC_KEY_RESPONSE
      );

      if (checkOriginResponse) {
        return {
          requestId: message?.requestId,
          ...checkOriginResponse,
        };
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "account",
          "read",
          [address]
        );
      } catch (error) {
        return {
          requestId: message?.requestId,
          ...returnExtensionErr(error, PUBLIC_KEY_RESPONSE),
        };
      }

      const vaultStatus = store.getState().vault;

      if (
        (vaultStatus.isUnlockedStatus === "yes" || vaultStatus.vaultSession) &&
        ExtensionVaultInstance.isUnlocked
      ) {
        return {
          type: PUBLIC_KEY_RESPONSE,
          error: null,
          data: {
            publicKey: await ExtensionVaultInstance.getPublicKey(
              sessionId,
              address
            ),
          },
          requestId: message?.requestId,
        };
      }

      return this._addExternalRequest(
        {
          type: PUBLIC_KEY_REQUEST,
          tabId: sender.tab.id,
          protocol: SupportedProtocols.Pocket,
          requestId: message?.requestId,
          ...message.data,
        },
        PUBLIC_KEY_RESPONSE
      );
    } catch (e) {
      if (e?.name === VaultIsLockedErrorName) {
        return {
          type: PUBLIC_KEY_RESPONSE,
          error: UnauthorizedError,
          data: null,
          requestId: message?.requestId,
        };
      }

      return {
        type: PUBLIC_KEY_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _handleListAccountsRequest(
    message: ExternalListAccountsReq
  ): Promise<ExternalListAccountsRes> {
    try {
      const sessionId = message?.data?.sessionId;

      if (!sessionId) {
        return {
          type: LIST_ACCOUNTS_RESPONSE,
          data: {
            accounts: [],
          },
          error: null,
          requestId: message?.requestId,
        };
      }

      const checkOriginResponse = await this._checkOriginIsBlocked(
        message?.data?.origin,
        LIST_ACCOUNTS_RESPONSE
      );

      if (checkOriginResponse) {
        return {
          requestId: message?.requestId,
          ...checkOriginResponse,
        };
      }

      const sessionIsValid = await ExtensionVaultInstance.isSessionValid(
        sessionId
      );

      if (!sessionIsValid) {
        return {
          type: LIST_ACCOUNTS_RESPONSE,
          data: {
            accounts: [],
          },
          error: null,
          requestId: message?.requestId,
        };
      }

      const session = await ExtensionVaultInstance.getSession(sessionId);

      let allAddresses: string[] = [];
      const requestProtocol = message?.data?.protocol;

      for (const permission of session.permissions) {
        if (permission.resource === "account" && permission.action === "read") {
          allAddresses = permission.identities.filter((item) =>
            isValidAddress(item, requestProtocol)
          );
          break;
        }
      }

      const currentSelectedAccountForProtocol =
        store.getState().app.selectedAccountByProtocol[requestProtocol];

      const selectedAccountOnApp = allAddresses.find(
        (address) => address === currentSelectedAccountForProtocol
      );

      let addresses: string[];

      if (selectedAccountOnApp) {
        addresses = [
          selectedAccountOnApp,
          ...allAddresses.filter(
            (address) => address !== currentSelectedAccountForProtocol
          ),
        ];
      } else {
        addresses = allAddresses;
      }

      return {
        type: LIST_ACCOUNTS_RESPONSE,
        data: {
          accounts: addresses,
        },
        error: null,
        requestId: message?.requestId,
      };
    } catch (e) {
      return {
        type: LIST_ACCOUNTS_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _handleBalanceRequest(
    message: ExternalBalanceReq
  ): Promise<ExternalBalanceRes> {
    const { data } = message || {};
    try {
      const checkOriginResponse = await this._checkOriginIsBlocked(
        data?.origin,
        EXTERNAL_ACCOUNT_BALANCE_RESPONSE
      );

      if (checkOriginResponse) {
        return {
          requestId: message?.requestId,
          ...checkOriginResponse,
        };
      }

      let chainId = store.getState().app.selectedChainByProtocol[data.protocol];

      if (!chainId) {
        chainId = data.protocol === SupportedProtocols.Pocket ? "mainnet" : "1";
      }

      const balance = await store
        .dispatch(
          balanceApi.endpoints.getBalance.initiate({
            address: data.address,
            protocol: data.protocol,
            chainId,
          })
        )
        .unwrap();

      let balanceToReturn;

      if (data.protocol === SupportedProtocols.Pocket) {
        // balance should be returned in uPOKT
        balanceToReturn = balance ? balance * 1e6 : 0;
      } else {
        balanceToReturn = "0x" + BigInt(toWei(balance, "ether")).toString(16);
      }

      return {
        type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
        error: null,
        requestId: message?.requestId,
        data: {
          balance: balanceToReturn,
        },
      };
    } catch (e) {
      return {
        type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _handleGetSelectedChain(
    message: ExternalSelectedChainReq
  ): Promise<ExternalSelectedChainRes> {
    try {
      const { data } = message || {};
      const checkOriginResponse = await this._checkOriginIsBlocked(
        data?.origin,
        SELECTED_CHAIN_RESPONSE
      );

      if (checkOriginResponse) {
        return {
          requestId: message?.requestId,
          ...checkOriginResponse,
        };
      }

      let chainId = store.getState().app.selectedChainByProtocol[data.protocol];

      if (data.protocol === SupportedProtocols.Ethereum) {
        chainId = `0x${Number(chainId || "1").toString(16)}`;
      }

      return {
        type: SELECTED_CHAIN_RESPONSE,
        error: null,
        data: {
          chainId,
        },
        requestId: message?.requestId,
      };
    } catch (e) {
      return {
        type: SELECTED_CHAIN_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _getPoktTx(
    message: ExternalGetPoktTxReq
  ): Promise<ExternalGetPoktTxRes> {
    try {
      const { origin, hash } = message?.data || {};
      const checkOriginResponse = await this._checkOriginIsBlocked(
        origin,
        GET_POKT_TRANSACTION_RESPONSE
      );

      if (checkOriginResponse) {
        return {
          requestId: message?.requestId,
          ...checkOriginResponse,
        };
      }

      const pocketProtocolService = new PocketNetworkProtocolService(
        new WebEncryptionService()
      );

      const state = store.getState();
      const protocol = SupportedProtocols.Pocket;
      const chainId = state.app.selectedChainByProtocol[protocol] || "mainnet";

      const preferredRpc = state.app.customRpcs.find(
        (rpc) => rpc.protocol === protocol && rpc.chainId === chainId
      );

      const defaultNetwork = state.app.networks.find(
        (network) =>
          network.protocol === protocol && network.chainId === chainId
      );

      const network: INetwork = {
        protocol,
        chainID: chainId,
        rpcUrl: preferredRpc?.url || defaultNetwork.rpcUrl,
      };

      const result = await pocketProtocolService.getTransactionByHash(
        network,
        hash
      );

      return {
        type: GET_POKT_TRANSACTION_RESPONSE,
        data: {
          tx: result,
        },
        error: null,
        requestId: message?.requestId,
      };
    } catch (e) {
      return {
        type: GET_POKT_TRANSACTION_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _checkOriginIsBlocked<
    T extends
      | typeof CONNECTION_RESPONSE_MESSAGE
      | typeof TRANSFER_RESPONSE
      | typeof DISCONNECT_RESPONSE
      | typeof IS_SESSION_VALID_RESPONSE
      | typeof LIST_ACCOUNTS_RESPONSE
      | typeof EXTERNAL_ACCOUNT_BALANCE_RESPONSE
      | typeof SELECTED_CHAIN_RESPONSE
      | typeof GET_POKT_TRANSACTION_RESPONSE
      | typeof SWITCH_CHAIN_RESPONSE
      | typeof SIGN_TYPED_DATA_RESPONSE
      | typeof PERSONAL_SIGN_RESPONSE
      | typeof STAKE_NODE_RESPONSE
      | typeof UNSTAKE_NODE_RESPONSE
      | typeof PUBLIC_KEY_RESPONSE
  >(
    origin: string,
    responseMessage: T
  ): Promise<{
    type: T;
    error:
      | ReturnType<typeof propertyIsRequired>
      | typeof UnauthorizedError
      | typeof UnknownError;
    data: null;
  } | void> {
    try {
      if (!origin) {
        return {
          type: responseMessage,
          error: propertyIsRequired("origin"),
          data: null,
        };
      }

      const blockSites = await store.dispatch(getBlockedSites()).unwrap();

      if (blockSites.includes(origin)) {
        return {
          type: responseMessage,
          error: UnauthorizedError,
          data: null,
        };
      }
    } catch (e) {
      return {
        type: responseMessage,
        error: UnknownError,
        data: null,
      };
    }
  }
}

export default ExternalCommunicationController;
