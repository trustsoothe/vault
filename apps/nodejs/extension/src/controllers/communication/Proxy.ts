// Controller to manage the communication between the webpages and the content script
import browser from "webextension-polyfill";
import { z, ZodError } from "zod";
import { Permission } from "@poktscan/keyring";
import {
  CHECK_CONNECTION_REQUEST,
  CONNECTION_REQUEST_MESSAGE,
  CONNECTION_RESPONSE_MESSAGE,
  IS_SESSION_VALID_REQUEST,
  IS_SESSION_VALID_RESPONSE,
  NEW_ACCOUNT_REQUEST,
  NEW_ACCOUNT_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
} from "../../constants/communication";
import {
  AmountNotPresented,
  AmountNotValid,
  ForbiddenSession,
  FromAddressNotPresented,
  FromAddressNotValid,
  InvalidBody,
  InvalidSession,
  NotConnected,
  OriginNotPresented,
  RequestConnectionExists,
  RequestNewAccountExists,
  RequestTransferExists,
  SessionIdNotPresented,
  ToAddressNotPresented,
  ToAddressNotValid,
} from "../../errors/communication";
import { isHex } from "../../utils";

const id = "ihemdpidnelcmpnndlfkhkebmbgjnehb";

interface Session {
  id: string;
  permissions: Permission[];
  maxAge: number;
  createdAt: number;
}

type ConnectionError =
  | null
  | typeof OriginNotPresented
  | typeof RequestConnectionExists;

interface ConnectionResponse {
  type: typeof CONNECTION_RESPONSE_MESSAGE;
  data: {
    accepted: boolean;
    session: Session | null;
  } | null;
  error: ConnectionError;
}

type IsSessionValidError = null | typeof SessionIdNotPresented;

interface IsSessionValidResponse {
  type: typeof IS_SESSION_VALID_RESPONSE;
  data: {
    isValid: boolean;
  } | null;
  error: IsSessionValidError;
}

type NewAccountError =
  | typeof SessionIdNotPresented
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof OriginNotPresented
  | typeof RequestNewAccountExists
  | null;

type TransferError =
  | typeof SessionIdNotPresented
  | typeof InvalidSession
  | typeof ForbiddenSession
  | typeof OriginNotPresented
  | typeof RequestTransferExists
  | typeof AmountNotPresented
  | typeof ToAddressNotPresented
  | typeof FromAddressNotPresented
  | null;

interface NewAccountResponse {
  type: typeof NEW_ACCOUNT_RESPONSE;
  data: {
    rejected: boolean;
    address: string | null;
  } | null;
  error: NewAccountError;
}

interface TransferResponse {
  type: typeof TRANSFER_RESPONSE;
  data: {
    rejected: boolean;
    hash: string | null;
  } | null;
  error: TransferError;
}

type ExtensionResponses =
  | ConnectionResponse
  | NewAccountResponse
  | TransferResponse;

interface BaseBrowserRequest {
  to: "VAULT_KEYRING";
}

interface ConnectionRequest extends BaseBrowserRequest {
  type: typeof CONNECTION_REQUEST_MESSAGE;
}

interface CheckConnectionRequest extends BaseBrowserRequest {
  type: typeof CHECK_CONNECTION_REQUEST;
}

interface NewAccountRequest extends BaseBrowserRequest {
  type: typeof NEW_ACCOUNT_REQUEST;
}

interface TransferRequest extends BaseBrowserRequest {
  type: typeof TRANSFER_REQUEST;
  data: z.infer<typeof TransferRequestBody>;
}

type BrowserRequest =
  | ConnectionRequest
  | CheckConnectionRequest
  | NewAccountRequest
  | TransferRequest;

const TransferRequestBody = z.object({
  toAddress: z
    .string()
    .length(40)
    .refine(isHex, "toAddress is not a valid address"),
  fromAddress: z
    .string()
    .length(40)
    .refine(isHex, "fromAddress is not a valid address"),
  amount: z.number().min(0.01),
});

class ProxyCommunicationController {
  private _session: Session | null = null;

  constructor() {
    this._checkLastSession();

    window.addEventListener(
      "message",
      async (event: MessageEvent<BrowserRequest>) => {
        const { data, origin } = event;

        if (origin === window.location.origin && data?.to === "VAULT_KEYRING") {
          if (data?.type === CONNECTION_REQUEST_MESSAGE) {
            await this._sendConnectionRequest();
          }

          if (data?.type === CHECK_CONNECTION_REQUEST) {
            await this._checkConnectionResponse();
          }

          if (data?.type === NEW_ACCOUNT_REQUEST) {
            await this._sendNewAccountRequest();
          }

          if (data?.type === TRANSFER_REQUEST) {
            await this._sendTransferRequest(data.data);
          }

          // @ts-ignore
          if (data?.type === "LOG_SESSION") {
            console.log(this._session);
          }
        }
      }
    );

    browser.runtime.onMessage.addListener(
      async (message: ExtensionResponses, sender) => {
        if (sender.id === id) {
          if (message?.type === CONNECTION_RESPONSE_MESSAGE) {
            await this._handleConnectionResponse(message);
          }

          if (message?.type === NEW_ACCOUNT_RESPONSE) {
            await this._handleNewAccountResponse(message);
          }

          if (message?.type === TRANSFER_RESPONSE) {
            await this._handleTransferResponse(message);
          }

          return "RECEIVED";
        } else {
          return "NOT_FOR_ME";
        }
      }
    );
  }

  private _getFaviconUrl() {
    let faviconUrl: string;
    const faviconFromSelector: HTMLAnchorElement = document.querySelector(
      "link[rel*='icon']"
    );

    if (faviconFromSelector) {
      faviconUrl = faviconFromSelector.href;
    }
    return faviconUrl || "";
  }

  private async _sendConnectionRequest() {
    const response = await browser.runtime.sendMessage({
      type: CONNECTION_REQUEST_MESSAGE,
      data: {
        origin: window.location.origin,
        faviconUrl: this._getFaviconUrl(),
      },
    });

    console.log("RESPONSE:", response);

    if (response?.type === CONNECTION_RESPONSE_MESSAGE) {
      await this._handleConnectionResponse(response);
    }
  }

  private async _handleConnectionResponse(
    extensionResponse: ConnectionResponse
  ) {
    console.log(extensionResponse);
    const { error, data } = extensionResponse;

    if (data) {
      const { accepted, session } = data;

      if (accepted && session) {
        this._session = session;

        await browser.storage.local.set({
          [`${window.location.origin}-session`]: session,
        });

        this._sendConnectionResponse(true);
      } else {
        this._sendConnectionResponse(false);
      }
    } else {
      this._sendConnectionResponse(false, error);
    }
  }

  private _sendConnectionResponse(
    connectionEstablished: boolean,
    error: ConnectionError | IsSessionValidError = null
  ) {
    window.postMessage({
      from: "VAULT_KEYRING",
      type: CONNECTION_RESPONSE_MESSAGE,
      data: {
        connectionEstablished,
      },
      error,
    });
  }

  private _checkLastSession() {
    browser.storage.local
      .get({ [`${window.location.origin}-session`]: null })
      .then(async (response) => {
        const session: Session = response[`${window.location.origin}-session`];

        if (session) {
          const messageResponse: IsSessionValidResponse =
            await browser.runtime.sendMessage({
              type: IS_SESSION_VALID_REQUEST,
              data: {
                sessionId: session.id,
              },
            });
          if (
            messageResponse?.type === IS_SESSION_VALID_RESPONSE &&
            messageResponse?.data
          ) {
            const isValid = messageResponse?.data?.isValid;

            if (isValid) {
              this._session = session;
              this._sendConnectionResponse(true);
            } else {
              if (typeof isValid === "boolean") {
                await browser.storage.local.remove(
                  `${window.location.origin}-session`
                );
              }
            }
          }
        }
      });
  }

  private async _checkConnectionResponse() {
    let connected = false,
      error: IsSessionValidError = null;

    if (this._session) {
      const messageResponse: IsSessionValidResponse =
        await browser.runtime.sendMessage({
          type: IS_SESSION_VALID_REQUEST,
          data: {
            sessionId: this._session.id,
          },
        });

      connected = messageResponse?.data?.isValid || false;
      error = messageResponse?.error;

      if (!connected) {
        this._session = null;
      }
    }

    this._sendConnectionResponse(connected, error);
  }

  private async _sendNewAccountRequest() {
    if (this._session) {
      const response = await browser.runtime.sendMessage({
        type: NEW_ACCOUNT_REQUEST,
        data: {
          origin: window.location.origin,
          faviconUrl: this._getFaviconUrl(),
          sessionId: this._session.id,
        },
      });

      console.log("RESPONSE:", response);

      if (response?.type === NEW_ACCOUNT_RESPONSE) {
        await this._handleNewAccountResponse(response);
      }
    } else {
      return this._sendNewAccountResponse(true, null, NotConnected);
    }
  }

  private async _handleNewAccountResponse(response: NewAccountResponse) {
    console.log(response);
    const { error, data } = response;

    if (data) {
      const { rejected, address } = data;

      this._sendNewAccountResponse(rejected, address);
    } else {
      this._sendNewAccountResponse(false, null, error);
    }
  }

  private _sendNewAccountResponse(
    rejected: boolean,
    address: string = null,
    error: NewAccountError = null
  ) {
    window.postMessage({
      from: "VAULT_KEYRING",
      type: NEW_ACCOUNT_RESPONSE,
      data: {
        rejected,
        address,
      },
      error,
    });
  }

  private async _sendTransferRequest(data: TransferRequest["data"]) {
    if (this._session) {
      let { fromAddress, toAddress, amount } = data || {};

      if (!fromAddress) {
        return this._sendTransferResponse(true, null, FromAddressNotPresented);
      }

      if (!toAddress) {
        return this._sendTransferResponse(true, null, ToAddressNotPresented);
      }

      if (!amount) {
        return this._sendTransferResponse(true, null, AmountNotPresented);
      }

      try {
        TransferRequestBody.parse(data);
      } catch (e) {
        const zodError: ZodError = e;
        const path = zodError?.issues?.[0]?.path?.[0];

        switch (path) {
          case "toAddress": {
            return this._sendTransferResponse(true, null, ToAddressNotValid);
          }
          case "fromAddress": {
            return this._sendTransferResponse(true, null, FromAddressNotValid);
          }
          case "amount": {
            return this._sendTransferResponse(true, null, AmountNotValid);
          }
          default: {
            return this._sendTransferResponse(true, null, InvalidBody);
          }
        }
      }

      const response = await browser.runtime.sendMessage({
        type: TRANSFER_REQUEST,
        data: {
          origin: window.location.origin,
          faviconUrl: this._getFaviconUrl(),
          sessionId: this._session.id,
          fromAddress,
          toAddress,
          amount,
        },
      });

      console.log("RESPONSE:", response);

      if (response?.type === TRANSFER_RESPONSE) {
        await this._handleTransferResponse(response);
      }
    } else {
      return this._sendTransferResponse(true, null, NotConnected);
    }
  }

  private async _handleTransferResponse(response: TransferResponse) {
    console.log(response);
    const { error, data } = response;

    if (data) {
      const { rejected, hash } = data;

      this._sendTransferResponse(rejected, hash);
    } else {
      this._sendTransferResponse(false, null, error);
    }
  }

  private _sendTransferResponse(
    rejected: boolean,
    hash: string = null,
    error: NewAccountError = null
  ) {
    window.postMessage({
      from: "VAULT_KEYRING",
      type: TRANSFER_RESPONSE,
      data: {
        rejected,
        hash,
      },
      error,
    });
  }
}

export default ProxyCommunicationController;
