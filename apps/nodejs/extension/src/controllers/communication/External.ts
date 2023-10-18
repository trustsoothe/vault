import type {
  BaseErrors,
  ConnectionRequestMessage,
  DisconnectRequestMessage,
  ListAccountsRequestMessage,
  NewAccountRequestMessage,
  RequestExistsError,
  SessionValidRequestMessage,
  TransferRequestMessage,
  DisconnectBackResponse,
  ExternalConnectionResponse,
  ExternalListAccountsResponse,
  ExternalNewAccountResponse,
  ExternalTransferResponse,
  IsSessionValidResponse,
  TRequestBeingHandled,
} from "../../types/communication";
import browser, { type Runtime } from "webextension-polyfill";
import {
  AmountHigherThanBalance,
  FeeLowerThanMinFee,
  OriginBlocked,
  OriginNotPresented,
  RequestConnectionExists,
  RequestNewAccountExists,
  RequestTransferExists,
  SessionIdNotPresented,
  UnknownError,
  VaultIsLocked,
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
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  LIST_ACCOUNTS_REQUEST,
  LIST_ACCOUNTS_RESPONSE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  REQUEST_BEING_HANDLED,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import {
  AssetStorage,
  getVault,
  NetworkStorage,
  returnExtensionErr,
} from "../../utils";
import { getFee, getAccountBalance } from "../../utils/networkOperations";
import {
  getAccountBalance as getAccountBalanceFromState,
  getAllBalances,
  getProtocolFee,
  revokeSession,
} from "../../redux/slices/vault";
import { HEIGHT, WIDTH } from "../../constants/ui";

type MessageSender = Runtime.MessageSender;

const RequestBeingHandledResponse: TRequestBeingHandled = {
  type: REQUEST_BEING_HANDLED,
};

export type Message =
  | ConnectionRequestMessage
  | SessionValidRequestMessage
  | NewAccountRequestMessage
  | TransferRequestMessage
  | DisconnectRequestMessage
  | ListAccountsRequestMessage;

const ExtensionVaultInstance = getVault();

// Controller to manage the communication between the background and the content script.
// The content script is the one sending messages and the background response the messages.
// This is intended to be used in the background.
class ExternalCommunicationController {
  public async onMessageHandler(message: Message, sender: MessageSender) {
    let isRequestBeingHandled = false;
    if (message.type === CONNECTION_REQUEST_MESSAGE) {
      const response = await this._handleConnectionRequest(message, sender);

      if (response && response.type === CONNECTION_RESPONSE_MESSAGE) {
        return response;
      }
      isRequestBeingHandled = true;
    }

    if (message.type === IS_SESSION_VALID_REQUEST) {
      const response = await this._isSessionValid(message);

      if (response?.type === IS_SESSION_VALID_RESPONSE) {
        return response;
      }
      isRequestBeingHandled = true;
    }

    if (message.type === NEW_ACCOUNT_REQUEST) {
      const response = await this._handleNewAccountRequest(message, sender);

      if (response && response?.type === NEW_ACCOUNT_RESPONSE) {
        return response;
      }
      isRequestBeingHandled = true;
    }

    if (message?.type === TRANSFER_REQUEST) {
      const response = await this._handleTransferRequest(message, sender);

      if (response && response?.type === TRANSFER_RESPONSE) {
        return response;
      }
      isRequestBeingHandled = true;
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

    if (isRequestBeingHandled) {
      return RequestBeingHandledResponse;
    }
  }

  private async _handleConnectionRequest(
    message: ConnectionRequestMessage,
    sender: MessageSender
  ): Promise<ExternalConnectionResponse> {
    try {
      const { origin, faviconUrl, suggestedPermissions } = message?.data || {};

      return this._addExternalRequest(
        {
          type: CONNECTION_REQUEST_MESSAGE,
          origin,
          faviconUrl,
          tabId: sender.tab.id,
          suggestedPermissions,
        },
        CONNECTION_RESPONSE_MESSAGE
      );
    } catch (e) {
      return {
        type: CONNECTION_RESPONSE_MESSAGE,
        data: null,
        error: UnknownError,
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
        };
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "account",
          "create"
        );
      } catch (error) {
        return returnExtensionErr(error, NEW_ACCOUNT_RESPONSE);
      }

      return this._addExternalRequest(
        {
          type: NEW_ACCOUNT_REQUEST,
          origin,
          faviconUrl,
          tabId: sender.tab.id,
          sessionId,
          protocol,
        },
        NEW_ACCOUNT_RESPONSE
      );
    } catch (e) {
      return {
        type: NEW_ACCOUNT_RESPONSE,
        error: UnknownError,
        data: null,
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
        faviconUrl,
        origin,
        fromAddress,
        toAddress,
        amount,
        memo,
        protocol,
        fee: feeFromData,
      } = message?.data || {};

      if (!sessionId) {
        return {
          type: TRANSFER_RESPONSE,
          error: SessionIdNotPresented,
          data: null,
        };
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "transaction",
          "send"
        );
      } catch (error) {
        return returnExtensionErr(error, TRANSFER_RESPONSE);
      }

      const state = store.getState();
      let balance, minFee;

      const isUnlocked = state.vault.isUnlockedStatus === "yes";

      if (isUnlocked) {
        const result = await store
          .dispatch(
            getAccountBalanceFromState({
              address: fromAddress,
              protocol: protocol.name,
              chainId: protocol.chainID as any,
            })
          )
          .unwrap();
        balance = result.amount;
        const feeResult = await store
          .dispatch(
            getProtocolFee({
              chainId: protocol.chainID as any,
              protocol: protocol.name,
            })
          )
          .unwrap();
        minFee = feeResult.fee;
      } else {
        const networks = await NetworkStorage.list().then((items) =>
          items.concat()
        );
        const assets = await AssetStorage.list().then((items) =>
          items.concat()
        );
        balance = await getAccountBalance({
          address: fromAddress,
          protocol: protocol.name,
          chainId: protocol.chainID as any,
          assets,
          networks,
        });
        const feeResult = await getFee({
          protocol: protocol.name,
          chainId: protocol.chainID as any,
          networks,
        });
        minFee = feeResult.fee;
      }

      if (feeFromData && minFee > feeFromData) {
        return {
          type: TRANSFER_RESPONSE,
          error: FeeLowerThanMinFee,
          data: null,
        };
      }

      const fee = feeFromData || minFee;

      if (amount > balance - fee) {
        return {
          type: TRANSFER_RESPONSE,
          error: AmountHigherThanBalance,
          data: null,
        };
      }

      return this._addExternalRequest(
        {
          type: TRANSFER_REQUEST,
          origin,
          faviconUrl,
          tabId: sender.tab.id,
          sessionId,
          fromAddress,
          toAddress,
          amount,
          memo,
          protocol,
          fee,
        },
        TRANSFER_RESPONSE
      );
    } catch (e) {
      return {
        type: TRANSFER_RESPONSE,
        error: UnknownError,
        data: null,
      };
    }
  }

  private async _addExternalRequest<
    T extends
      | typeof CONNECTION_RESPONSE_MESSAGE
      | typeof NEW_ACCOUNT_RESPONSE
      | typeof TRANSFER_RESPONSE
  >(
    request: RequestsType,
    responseMessage: T
  ): Promise<{
    type: T;
    error: BaseErrors | RequestExistsError<T>;
    data: null;
  } | void> {
    let requestWasAdded = false;
    try {
      const checkOriginResponse = await this._checkOriginIsBlocked(
        request.origin,
        responseMessage
      );

      if (checkOriginResponse) {
        return checkOriginResponse;
      }

      const { externalRequests, requestsWindowId } = store.getState().app;

      const pendingRequestWindow = externalRequests.find(
        (item) => item.origin === request.origin && item.type === request.type
      );

      if (pendingRequestWindow) {
        return {
          type: responseMessage,
          error: (responseMessage === CONNECTION_RESPONSE_MESSAGE
            ? RequestConnectionExists
            : responseMessage === NEW_ACCOUNT_RESPONSE
            ? RequestNewAccountExists
            : RequestTransferExists) as RequestExistsError<T>,
          data: null,
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
          error: SessionIdNotPresented,
          data: null,
        };
      }

      const checkOriginResponse = await this._checkOriginIsBlocked(
        message?.data?.origin,
        LIST_ACCOUNTS_RESPONSE
      );

      if (checkOriginResponse) {
        return checkOriginResponse;
      }

      try {
        await ExtensionVaultInstance.validateSessionForPermissions(
          sessionId,
          "account",
          "read"
        );
      } catch (error) {
        return returnExtensionErr(error, LIST_ACCOUNTS_RESPONSE);
      }

      const { isUnlockedStatus } = store.getState().vault;

      if (isUnlockedStatus !== "yes") {
        return {
          type: LIST_ACCOUNTS_RESPONSE,
          error: VaultIsLocked,
          data: null,
        };
      }

      const accounts = await ExtensionVaultInstance.listAccounts(sessionId);
      const response = await store.dispatch(getAllBalances()).unwrap();
      const balanceByIdMap = response.newBalanceMap;

      return {
        type: LIST_ACCOUNTS_RESPONSE,
        data: {
          accounts: accounts.map((item) => ({
            ...item.serialize(),
            balance: balanceByIdMap[item.id]?.amount || 0,
          })),
        },
        error: null,
      };
    } catch (e) {
      return {
        type: LIST_ACCOUNTS_RESPONSE,
        error: UnknownError,
        data: null,
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
  >(
    origin: string,
    responseMessage: T
  ): Promise<{
    type: T;
    error:
      | typeof OriginNotPresented
      | typeof OriginBlocked
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
          error: OriginBlocked,
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
