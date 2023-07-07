import browser, { Runtime } from "webextension-polyfill";
import {
  ForbiddenSession,
  InvalidSession,
  OriginNotPresented,
  RequestConnectionExists,
  RequestNewAccountExists,
  RequestTransferExists,
  SessionIdNotPresented,
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
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  REQUEST_BEING_HANDLED,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import { getVault } from "../../utils";
import {
  ForbiddenSessionError,
  InvalidSessionError,
  SessionNotFoundError,
} from "@poktscan/keyring";
import MessageSender = Runtime.MessageSender;

export interface ConnectionRequestMessage {
  type: typeof CONNECTION_REQUEST_MESSAGE;
  data: {
    origin: string;
    faviconUrl: string;
  };
}

export interface SessionValidRequestMessage {
  type: typeof IS_SESSION_VALID_REQUEST;
  data: {
    sessionId: string;
  };
}

export interface NewAccountRequestMessage {
  type: typeof NEW_ACCOUNT_REQUEST;
  data: {
    sessionId: string;
    origin: string;
    faviconUrl: string;
  };
}

export interface TransferRequestMessage {
  type: typeof TRANSFER_REQUEST;
  data: {
    sessionId: string;
    origin: string;
    faviconUrl: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
  };
}

const RequestBeingHandledResponse = {
  type: REQUEST_BEING_HANDLED,
};

export type Message =
  | ConnectionRequestMessage
  | SessionValidRequestMessage
  | NewAccountRequestMessage
  | TransferRequestMessage;

const ExtensionVaultInstance = getVault();

// Controller to manage the communication between the background and the content script.
// The content script is the one sending messages and the background response the messages.
// This is intended to be used in the background.
class ExternalCommunicationController {
  public async onMessageHandler(message: Message, sender: MessageSender) {
    let isRequestBeingHandled = false;
    if (message.type === CONNECTION_REQUEST_MESSAGE) {
      const response = await this._handleConnectionRequest(message, sender);

      if (response?.type === CONNECTION_RESPONSE_MESSAGE) {
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

      if (response?.type === NEW_ACCOUNT_RESPONSE) {
        return response;
      }
      isRequestBeingHandled = true;
    }

    if (isRequestBeingHandled) {
      return RequestBeingHandledResponse;
    }
  }

  private async _handleConnectionRequest(
    message: ConnectionRequestMessage,
    sender: MessageSender
  ) {
    const { origin, faviconUrl } = message?.data || {};

    return this._addExternalRequest(
      {
        type: CONNECTION_REQUEST_MESSAGE,
        origin,
        faviconUrl,
        tabId: sender.tab.id,
      },
      CONNECTION_RESPONSE_MESSAGE
    );
  }

  private async _isSessionValid(message: SessionValidRequestMessage) {
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
        error: { name: "add default error" },
        data: null,
      };
    }

    return this._addExternalRequest(
      {
        type: NEW_ACCOUNT_REQUEST,
        origin,
        faviconUrl,
        tabId: sender.tab.id,
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
        "sign",
        [fromAddress]
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
        //todo: add default error
        error: { name: "add default error" },
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
}

export default ExternalCommunicationController;
