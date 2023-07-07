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
  NEW_ACCOUNT_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
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
  ExternalAccessRequest,
  OriginReference,
  Permission,
  SerializedAsset,
  SerializedSession,
} from "@poktscan/keyring";
import { authorizeExternalSession } from "../../redux/slices/vault";
import MessageSender = Runtime.MessageSender;

export interface AnswerConnectionRequest {
  type: typeof ANSWER_CONNECTION_REQUEST;
  data: {
    accepted: boolean;
    permissions: Permission[] | null;
    request: ConnectionRequest;
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

export type Message =
  | AnswerConnectionRequest
  | AnswerNewAccountRequest
  | AnswerTransferRequest;

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
  }

  private async _answerConnectionRequest(message: AnswerConnectionRequest) {
    const { accepted, permissions = [], request } = message?.data || {};
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
      const maxAge = 3600;
      const originReference = new OriginReference(origin);
      const requestReference = new ExternalAccessRequest(
        permissions,
        maxAge,
        originReference
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
    const { rejected, request } = message?.data;

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
      // todo: add create account code returning the address
      address = "25879ff86bd06d2cb34316d8380dd0ef20266dd0";

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
