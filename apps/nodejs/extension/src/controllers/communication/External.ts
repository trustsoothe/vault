import type { ICommunicationController } from "../../types";
import type {
  BalanceRequestMessage,
  BaseErrors,
  ConnectionRequestMessage,
  DisconnectBackResponse,
  DisconnectRequestMessage,
  ExternalBalanceResponse,
  ExternalConnectionResponse,
  ExternalGetPoktTxResponse,
  ExternalListAccountsResponse,
  ExternalNewAccountResponse,
  ExternalSelectedChainResponse,
  ExternalSignTypedDataResponse,
  ExternalSwitchChainResponse,
  ExternalTransferResponse,
  GetPoktTxRequestMessage,
  IsSessionValidResponse,
  ListAccountsRequestMessage,
  NewAccountRequestMessage,
  RequestExistsError,
  SelectedChainRequestMessage,
  SessionValidRequestMessage,
  SignTypedDataRequestMessage,
  SwitchChainRequestMessage,
  TransferRequestMessage,
} from "../../types/communication";
import {
  ExternalPersonalSignResponse,
  PersonalSignRequestMessage,
} from "../../types/communication";
import { toWei } from "web3-utils";
import browser, { type Runtime } from "webextension-polyfill";
import { WebEncryptionService } from "@poktscan/keyring-encryption-web";
import {
  INetwork,
  PocketNetworkProtocolService,
  SupportedProtocols,
} from "@poktscan/keyring";
import {
  OriginNotPresented,
  RequestConnectionExists,
  RequestNewAccountExists,
  RequestSwitchChainExists,
  RequestTransferExists,
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
  RequestsType,
} from "../../redux/slices/app";
import {
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  DISCONNECT_REQUEST,
  DISCONNECT_RESPONSE,
  EXTERNAL_ACCOUNT_BALANCE_REQUEST,
  EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
  GET_POKT_TRANSACTION_REQUEST,
  GET_POKT_TRANSACTION_RESPONSE,
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  PERSONAL_SIGN_REQUEST,
  PERSONAL_SIGN_RESPONSE,
  REQUEST_BEING_HANDLED,
  SELECTED_CHAIN_REQUEST,
  SELECTED_CHAIN_RESPONSE,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import { getVault, isHex, returnExtensionErr } from "../../utils";
import { getAccountBalance } from "../../redux/slices/app/network";
import { revokeSession } from "../../redux/slices/vault/session";
import { HEIGHT, WIDTH } from "../../constants/ui";
import { isValidAddress } from "../../utils/networkOperations";

type MessageSender = Runtime.MessageSender;

export type Message =
  | ConnectionRequestMessage
  | SessionValidRequestMessage
  | NewAccountRequestMessage
  | TransferRequestMessage
  | DisconnectRequestMessage
  | ListAccountsRequestMessage
  | SelectedChainRequestMessage
  | BalanceRequestMessage
  | GetPoktTxRequestMessage
  | SwitchChainRequestMessage
  | SignTypedDataRequestMessage
  | PersonalSignRequestMessage;

const mapMessageType: Record<Message["type"], true> = {
  [CONNECTION_REQUEST_MESSAGE]: true,
  [IS_SESSION_VALID_REQUEST]: true,
  [NEW_ACCOUNT_REQUEST]: true,
  [TRANSFER_REQUEST]: true,
  [SWITCH_CHAIN_REQUEST]: true,
  [DISCONNECT_REQUEST]: true,
  [LIST_ACCOUNTS_REQUEST]: true,
  [EXTERNAL_ACCOUNT_BALANCE_REQUEST]: true,
  [SELECTED_CHAIN_REQUEST]: true,
  [GET_POKT_TRANSACTION_REQUEST]: true,
  [SIGN_TYPED_DATA_REQUEST]: true,
  [PERSONAL_SIGN_REQUEST]: true,
};

const ExtensionVaultInstance = getVault();

// Controller to manage the communication between the background and the content script.
// The content script is the one sending messages and the background response the messages.
// This is intended to be used in the background.
class ExternalCommunicationController implements ICommunicationController {
  messageForController(messageType: string) {
    return mapMessageType[messageType] || false;
  }

  public async onMessageHandler(message: Message, sender: MessageSender) {
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

    if (message.type === NEW_ACCOUNT_REQUEST) {
      const response = await this._handleNewAccountRequest(message, sender);

      if (response && response?.type === NEW_ACCOUNT_RESPONSE) {
        return response;
      }
      return {
        requestId: message?.requestId,
        type: REQUEST_BEING_HANDLED,
      };
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

    if (message?.type === DISCONNECT_REQUEST) {
      const response = await this._handleDisconnectRequest(message);

      if (response?.type === DISCONNECT_RESPONSE) {
        return response;
      }
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
  }

  private async _handleConnectionRequest(
    message: ConnectionRequestMessage,
    sender: MessageSender
  ): Promise<ExternalConnectionResponse> {
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
    message: SwitchChainRequestMessage,
    sender: MessageSender
  ): Promise<ExternalSwitchChainResponse> {
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
    message: SessionValidRequestMessage
  ): Promise<IsSessionValidResponse> {
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

  private async _handleNewAccountRequest(
    message: NewAccountRequestMessage,
    sender: MessageSender
  ): Promise<ExternalNewAccountResponse> {
    try {
      const { sessionId, faviconUrl, origin, protocol } = message?.data || {};

      if (!sessionId) {
        return {
          type: NEW_ACCOUNT_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
          requestId: message?.requestId,
        };
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "account",
          "create"
        );
      } catch (error) {
        return {
          ...returnExtensionErr(error, NEW_ACCOUNT_RESPONSE),
          requestId: message?.requestId,
        };
      }

      return this._addExternalRequest(
        {
          type: NEW_ACCOUNT_REQUEST,
          origin,
          faviconUrl,
          tabId: sender.tab.id,
          sessionId,
          protocol,
          requestId: message?.requestId,
        },
        NEW_ACCOUNT_RESPONSE
      );
    } catch (e) {
      return {
        type: NEW_ACCOUNT_RESPONSE,
        error: UnknownError,
        data: null,
        requestId: message?.requestId,
      };
    }
  }

  private async _handleTransferRequest(
    message: TransferRequestMessage,
    sender: MessageSender
  ): Promise<ExternalTransferResponse> {
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

  private async _handleSignTypedDataRequest(
    message: SignTypedDataRequestMessage,
    sender: MessageSender
  ): Promise<ExternalSignTypedDataResponse> {
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
    message: PersonalSignRequestMessage,
    sender: MessageSender
  ): Promise<ExternalPersonalSignResponse> {
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
      | typeof NEW_ACCOUNT_RESPONSE
      | typeof TRANSFER_RESPONSE
      | typeof SWITCH_CHAIN_RESPONSE
      | typeof SIGN_TYPED_DATA_RESPONSE
      | typeof PERSONAL_SIGN_RESPONSE
  >(
    request: RequestsType,
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
          error: (responseMessage === CONNECTION_RESPONSE_MESSAGE
            ? RequestConnectionExists
            : responseMessage === NEW_ACCOUNT_RESPONSE
            ? RequestNewAccountExists
            : responseMessage === TRANSFER_RESPONSE
            ? RequestTransferExists
            : RequestSwitchChainExists) as RequestExistsError<T>,
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

  private async _handleDisconnectRequest(
    message: DisconnectRequestMessage
  ): Promise<DisconnectBackResponse> {
    try {
      const sessionId = message?.data?.sessionId;
      if (!sessionId) {
        return {
          type: DISCONNECT_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
        };
      }

      const checkOriginResponse = await this._checkOriginIsBlocked(
        message?.data?.origin,
        DISCONNECT_RESPONSE
      );

      if (checkOriginResponse) {
        return checkOriginResponse;
      }

      const session = await ExtensionVaultInstance.getSession(sessionId);
      const protocol = session?.protocol;

      try {
        await store
          .dispatch(revokeSession({ sessionId, external: true }))
          .unwrap();
      } catch (error) {
        return returnExtensionErr(error, DISCONNECT_RESPONSE);
      }

      return {
        type: DISCONNECT_RESPONSE,
        data: {
          disconnected: true,
          protocol,
        },
        error: null,
      };
    } catch (e) {
      return {
        type: DISCONNECT_RESPONSE,
        error: UnknownError,
        data: null,
      };
    }
  }

  private async _handleListAccountsRequest(
    message: ListAccountsRequestMessage
  ): Promise<ExternalListAccountsResponse> {
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
    message: BalanceRequestMessage
  ): Promise<ExternalBalanceResponse> {
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

      const result = await store
        .dispatch(
          getAccountBalance({
            address: data.address,
            protocol: data.protocol,
            chainId,
          })
        )
        .unwrap();

      let balanceToReturn;

      if (data.protocol === SupportedProtocols.Pocket) {
        // balance should be returned in uPOKT
        balanceToReturn = result.amount ? result.amount * 1e6 : 0;
      } else {
        balanceToReturn =
          "0x" + BigInt(toWei(result.amount, "ether")).toString(16);
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
    message: SelectedChainRequestMessage
  ): Promise<ExternalSelectedChainResponse> {
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
    message: GetPoktTxRequestMessage
  ): Promise<ExternalGetPoktTxResponse> {
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
      | typeof NEW_ACCOUNT_RESPONSE
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
  >(
    origin: string,
    responseMessage: T
  ): Promise<{
    type: T;
    error:
      | typeof OriginNotPresented
      | typeof UnauthorizedError
      | typeof UnknownError;
    data: null;
  } | void> {
    try {
      if (!origin) {
        return {
          type: responseMessage,
          error: OriginNotPresented,
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
