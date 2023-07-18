import browser, { Runtime } from "webextension-polyfill";
import {
  ForbiddenSessionError,
  InvalidSessionError,
  SessionNotFoundError,
} from "@poktscan/keyring";
import {
  ForbiddenSession,
  InvalidSession,
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
import { getVault } from "../../utils";
import { revokeSession } from "../../redux/slices/vault";
import MessageSender = Runtime.MessageSender;
import type {
  ConnectionRequestMessage,
  DisconnectRequestMessage,
  ListAccountsRequestMessage,
  NewAccountRequestMessage,
  SessionValidRequestMessage,
  TransferRequestMessage,
} from "../../types/communication";
import {
  ExternalConnectionResponse,
  IsSessionValidResponse,
  TRequestBeingHandled,
} from "../../types/communication";

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

      if (response?.type === NEW_ACCOUNT_RESPONSE) {
        return response;
      }
      isRequestBeingHandled = true;
    }

    if (message?.type === TRANSFER_REQUEST) {
      const response = await this._handleTransferRequest(message, sender);

      if (response?.type === TRANSFER_RESPONSE) {
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
  }

  private async _isSessionValid(
    message: SessionValidRequestMessage
  ): Promise<IsSessionValidResponse> {
    const sessionId = message?.data?.sessionId;

    if (!sessionId) {
      return {
        type: IS_SESSION_VALID_RESPONSE,
        error: SessionIdNotPresented,
        data: null,
      };
    }

    const isValid = await ExtensionVaultInstance.isSessionValid(sessionId);

    return {
      type: IS_SESSION_VALID_RESPONSE,
      error: null,
      data: {
        isValid,
      },
    };
  }

  private async _handleNewAccountRequest(
    message: NewAccountRequestMessage,
    sender: MessageSender
  ) {
    const { sessionId, faviconUrl, origin } = message?.data || {};

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
      if (error instanceof SessionNotFoundError) {
        return {
          type: NEW_ACCOUNT_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof InvalidSessionError) {
        return {
          type: NEW_ACCOUNT_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof ForbiddenSessionError) {
        return {
          type: NEW_ACCOUNT_RESPONSE,
          error: ForbiddenSession,
          data: null,
        };
      }

      return {
        type: NEW_ACCOUNT_RESPONSE,
        //todo: add default error
        error: UnknownError,
        data: null,
      };
    }

    return this._addExternalRequest(
      {
        type: NEW_ACCOUNT_REQUEST,
        origin,
        faviconUrl,
        tabId: sender.tab.id,
        sessionId,
      },
      NEW_ACCOUNT_RESPONSE
    );
  }

  private async _handleTransferRequest(
    message: TransferRequestMessage,
    sender: MessageSender
  ) {
    const { sessionId, faviconUrl, origin, fromAddress, toAddress, amount } =
      message?.data || {};

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
        "sign"
      );
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        return {
          type: TRANSFER_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof InvalidSessionError) {
        return {
          type: TRANSFER_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof ForbiddenSessionError) {
        return {
          type: TRANSFER_RESPONSE,
          error: ForbiddenSession,
          data: null,
        };
      }

      return {
        type: TRANSFER_RESPONSE,
        error: UnknownError,
        data: null,
      };
    }

    return this._addExternalRequest(
      {
        type: TRANSFER_REQUEST,
        origin,
        faviconUrl,
        tabId: sender.tab.id,
        fromAddress,
        toAddress,
        amount,
      },
      TRANSFER_RESPONSE
    );
  }

  private async _addExternalRequest(
    request: RequestsType,
    responseMessage:
      | typeof CONNECTION_RESPONSE_MESSAGE
      | typeof NEW_ACCOUNT_RESPONSE
      | typeof TRANSFER_RESPONSE
  ) {
    if (!request.origin) {
      return {
        type: responseMessage,
        error: OriginNotPresented,
        data: null,
      };
    }

    const { externalRequests, requestsWindowId } = store.getState().app;

    const pendingRequestWindow = externalRequests.find(
      (item) => item.origin === request.origin && item.type === request.type
    );

    if (pendingRequestWindow) {
      return {
        type: responseMessage,
        error:
          //todo: replace for map and add default request exists error
          responseMessage === CONNECTION_RESPONSE_MESSAGE
            ? RequestConnectionExists
            : responseMessage === NEW_ACCOUNT_RESPONSE
            ? RequestNewAccountExists
            : RequestTransferExists,
        data: null,
      };
    } else {
      await store.dispatch(addExternalRequest(request));

      if (!requestsWindowId) {
        const windowCreated = await browser.windows.create({
          url: "home.html?view=request",
          type: "popup",
          height: 510,
          width: 400,
        });

        await store.dispatch(addWindow(windowCreated.id));
      }

      await browser.action.setBadgeText({
        text: `${externalRequests.length + 1}`,
      });
    }
  }

  private async _handleDisconnectRequest(message: DisconnectRequestMessage) {
    const sessionId = message?.data?.sessionId;
    if (!sessionId) {
      return {
        type: DISCONNECT_RESPONSE,
        error: SessionIdNotPresented,
        data: null,
      };
    }

    try {
      await store
        .dispatch(revokeSession({ sessionId, external: true }))
        .unwrap();
    } catch (error) {
      // todo: add function to handle this errors
      if (error instanceof SessionNotFoundError) {
        return {
          type: DISCONNECT_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof InvalidSessionError) {
        return {
          type: DISCONNECT_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof ForbiddenSessionError) {
        return {
          type: DISCONNECT_RESPONSE,
          error: ForbiddenSession,
          data: null,
        };
      }

      return {
        type: DISCONNECT_RESPONSE,
        error: UnknownError,
        data: null,
      };
    }

    return {
      type: DISCONNECT_RESPONSE,
      data: {
        disconnected: true,
      },
      error: null,
    };
  }

  private async _handleListAccountsRequest(
    message: ListAccountsRequestMessage
  ) {
    const sessionId = message?.data?.sessionId;
    if (!sessionId) {
      return {
        type: LIST_ACCOUNTS_RESPONSE,
        error: SessionIdNotPresented,
        data: null,
      };
    }

    try {
      await ExtensionVaultInstance.validateSessionForPermissions(
        sessionId,
        "account",
        "read"
      );
    } catch (error) {
      // todo: add function to handle this errors
      if (error instanceof SessionNotFoundError) {
        return {
          type: LIST_ACCOUNTS_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof InvalidSessionError) {
        return {
          type: LIST_ACCOUNTS_RESPONSE,
          error: InvalidSession,
          data: null,
        };
      }

      if (error instanceof ForbiddenSessionError) {
        return {
          type: LIST_ACCOUNTS_RESPONSE,
          error: ForbiddenSession,
          data: null,
        };
      }

      return {
        type: LIST_ACCOUNTS_RESPONSE,
        error: UnknownError,
        data: null,
      };
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

    return {
      type: LIST_ACCOUNTS_RESPONSE,
      data: {
        // todo: add logic to add balance
        accounts: accounts.map((item) => item.serialize()),
      },
      error: null,
    };
  }
}

export default ExternalCommunicationController;
