import {
  ExternalBasePoktTxErrors,
  ExternalBulkSignTransactionReq,
  ExternalBulkSignTransactionRes,
  ExternalResponse,
  InternalBulkSignTransactionRes,
  InternalResponse,
  ProxyBulkSignTransactionReq,
  ProxyBulkSignTransactionRes,
  ProxyPoktTxRes,
} from "../../types/communications/transactions";
import type {
  ExternalPublicKeyReq,
  ExternalPublicKeyResToProxy,
  InternalPublicKeyRes,
  ProxyPublicKeyRes,
} from "../../types/communications/publicKey";
import type {
  InternalResponses,
  ProxyRequests,
} from "../../types/communications";
import type {
  ExternalConnectionReq,
  ExternalConnectionResToProxy,
  InternalConnectionRes,
  PartialSession,
  ProxyConnectionErrors,
  ProxyConnectionRes,
} from "../../types/communications/connection";
import type {
  ExternalTransferReq,
  ExternalTransferResToProxy,
  ProxyTransferError,
  ProxyTransferReq,
  ProxyTransferRes,
  TransferResponseFromBack,
} from "../../types/communications/transfer";
import type {
  AppIsReadyMessageToProvider,
  BackgroundAppIsReadyReq,
  BackgroundAppIsReadyRes,
} from "../../types/communications/appIsReady";
import type {
  ChainChangedMessageToProxy,
  ChainChangedToProvider,
} from "../../types/communications/chainChanged";
import type {
  ExternalIsSessionValidReq,
  ExternalIsSessionValidRes,
} from "../../types/communications/sessionIsValid";
import type {
  ExternalListAccountsReq,
  ExternalListAccountsRes,
  ProxyListAccountsRes,
} from "../../types/communications/listAccounts";
import type {
  ExternalBalanceReq,
  ExternalBalanceRes,
  ProxyBalanceRes,
} from "../../types/communications/balance";
import type {
  ExternalSelectedChainReq,
  ExternalSelectedChainRes,
  ProxySelectedChainRes,
} from "../../types/communications/selectedChain";
import type {
  ExternalGetPoktTxReq,
  ExternalGetPoktTxRes,
  ProxyGetPoktTxRes,
} from "../../types/communications/getPoktTransaction";
import type {
  ExternalSwitchChainReq,
  ExternalSwitchChainResToProxy,
  ProxySwitchChainRes,
} from "../../types/communications/switchChain";
import type {
  ExternalSignTypedDataReq,
  ExternalSignTypedDataResToProxy,
  InternalSignedTypedDataRes,
  ProxySignedTypedDataErrors,
  ProxySignedTypedDataRes,
  ProxySignTypedDataReq,
} from "../../types/communications/signTypedData";
import type {
  ExternalPersonalSignReq,
  ExternalPersonalSignResToProxy,
  InternalPersonalSignRes,
  ProxyPersonalSignReq,
  ProxyPersonalSignRes,
} from "../../types/communications/personalSign";
import type { AccountsChangedToProvider } from "../../types/communications/accountChanged";
import browser from "webextension-polyfill";
import { z, ZodError } from "zod";
import type {
  DAOAction,
  DAOActionArray,
  SupportedProtocols,
} from "@soothe/vault";
import {
  APP_IS_NOT_READY,
  APP_IS_READY,
  APP_IS_READY_REQUEST,
  BULK_SIGN_TRANSACTION_REQUEST,
  BULK_SIGN_TRANSACTION_RESPONSE,
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
  SELECTED_ACCOUNT_CHANGED,
  SELECTED_CHAIN_CHANGED,
  SELECTED_CHAIN_REQUEST,
  SELECTED_CHAIN_RESPONSE,
  SIGN_TRANSACTION_REQUEST,
  SIGN_TYPED_DATA_REQUEST,
  SIGN_TYPED_DATA_RESPONSE,
  STAKE_APP_REQUEST,
  STAKE_APP_RESPONSE,
  STAKE_NODE_REQUEST,
  STAKE_NODE_RESPONSE,
  SWITCH_CHAIN_REQUEST,
  SWITCH_CHAIN_RESPONSE,
  TRANSFER_APP_RESPONSE,
  TRANSFER_REQUEST,
  TRANSFER_RESPONSE,
  UNJAIL_NODE_REQUEST,
  UNJAIL_NODE_RESPONSE,
  UNSTAKE_APP_RESPONSE,
  UNSTAKE_NODE_REQUEST,
  UNSTAKE_NODE_RESPONSE,
  UPGRADE_REQUEST,
  UPGRADE_RESPONSE,
} from "../../constants/communication";
import {
  BlockNotSupported,
  OperationRejected,
  propertyIsNotValid,
  propertyIsRequired,
  SignTransactionOnlyAcceptsOne,
  UnauthorizedError,
  UnknownError,
  UnsupportedMethod,
} from "../../errors/communication";
import { isValidAddress, validateTypedDataPayload } from "../../utils/proxy";
import {
  CosmosProtocol,
  EthereumProtocol,
  PocketProtocol,
  supportedProtocolsArray,
} from "../../constants/protocols";

export type TPocketTransferBody = z.infer<typeof PocketTransferBody>;

const DaoTransferAction = "dao_transfer" as DAOAction.Transfer;
const DaoBurnAction = "dao_burn" as DAOAction.Burn;

const daoActions: DAOActionArray = [DaoTransferAction, DaoBurnAction] as const;

const memoSchema = z.string().max(75).optional();

const PocketTransferBody = z.object({
  from: z
    .string()
    .length(40)
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "from is not a valid address"
    ),
  to: z
    .string()
    .length(40)
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "from is not a valid address"
    ),
  amount: z
    .string()
    .nonempty()
    .regex(/^\d+$/)
    .refine((value) => Number(value) > 0, "amount should be greater than 0"),
  memo: memoSchema,
});
export type DaoTransferBody = z.infer<typeof DaoTransferBody>;

const DaoTransferBody = z
  .object({
    address: z
      .string()
      .length(40)
      .refine(
        (value) => isValidAddress(value, PocketProtocol),
        "address is not a valid address"
      ),
    to: z.string().optional(),
    amount: z
      .string()
      .nonempty()
      .regex(/^\d+$/)
      .refine((value) => Number(value) > 0, "amount should be greater than 0"),
    memo: memoSchema,
    daoAction: z
      .string()
      .refine((value) =>
        daoActions.includes(value as DAOAction.Transfer | DAOAction.Burn)
      ),
  })
  .refine(
    (value) =>
      value.daoAction === "dao_burn"
        ? true
        : isValidAddress(value.to || "", PocketProtocol),
    {
      path: ["to"],
      message: "to is not a valid address",
    }
  );

export type UpgradeBody = z.infer<typeof UpgradeBody>;

const UpgradeBody = z
  .object({
    address: z
      .string()
      .length(40)
      .refine(
        (value) => isValidAddress(value, PocketProtocol),
        "address is not a valid address"
      ),
    height: z.number().min(1).int(),
    version: z.union([
      z.string().regex(/^(\d+)\.(\d+)\.(\d+)(\.(\d+))?$/),
      z.literal("FEATURE"),
    ]),
    memo: memoSchema,
    features: z
      .array(
        z
          .string()
          .regex(
            /^[A-Za-z]+:\d+$/,
            "malformed feature, format should be: KEY:HEIGHT"
          )
          .refine(
            (value) => {
              const [_, height] = value.split(":");
              return Number(height) >= 0;
            },
            {
              message: "height should be greater or equal to 0",
            }
          )
      )
      .optional()
      .default([]),
  })
  .refine(
    (value) =>
      value.version !== "FEATURE" ||
      (value.version === "FEATURE" && value.height !== 1),
    {
      path: ["height"],
      message: "height should be equal to 1 when version is FEATURE",
    }
  )
  .refine(
    (value) =>
      value.version !== "FEATURE" ||
      (value.version === "FEATURE" && value.features.length > 0),
    {
      path: ["features"],
      message: "features should not be empty when version is FEATURE",
    }
  )
  .refine(
    (value) =>
      value.version === "FEATURE" ||
      (value.version !== "FEATURE" && value.features.length === 0),
    {
      path: ["features"],
      message: "features should be empty when version is not FEATURE",
    }
  );

const numberRegex = /^0x([1-9a-f]+[0-9a-f]*|0)$/;
const stringRegex = /^0x[0-9a-f]*$/;

export type TEthTransferBody = z.infer<typeof EthTransferBody>;

const EthTransferBody = z.object({
  from: z
    .string()
    .refine(
      (value) => isValidAddress(value, EthereumProtocol),
      "from is not a valid address"
    ),
  to: z
    .string()
    .refine(
      (value) => isValidAddress(value, EthereumProtocol),
      "from is not a valid address"
    ),
  gas: z.string().regex(numberRegex).optional(),
  value: z.string().regex(numberRegex).optional(),
  data: z.string().regex(stringRegex).optional(),
  maxPriorityFeePerGas: z.string().regex(numberRegex).optional(),
  maxFeePerGas: z.string().regex(numberRegex).optional(),
});

const StakeNodeBody = z.object({
  amount: z.string().nonempty(),
  chains: z.array(z.string()).nonempty(),
  serviceURL: z.string().nonempty(),
  address: z
    .string()
    .nonempty()
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "address is not a valid address"
    ),
  outputAddress: z
    .string()
    .optional()
    .refine(
      (value) => !value || isValidAddress(value, PocketProtocol),
      "outputAddress is not a valid address"
    ),
  operatorPublicKey: z.string().nonempty().optional(),
  memo: memoSchema,
  rewardDelegators: z.record(z.string(), z.number()).optional(),
});

export type StakeNodeBody = z.infer<typeof StakeNodeBody>;

const TransferAppBody = z.object({
  address: z
    .string()
    .nonempty()
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "address is not a valid address"
    ),
  // todo: add validation for this
  newAppPublicKey: z.string().nonempty(),
  memo: memoSchema,
});

export type TransferAppBody = z.infer<typeof TransferAppBody>;

const StakeAppBody = z.object({
  amount: z.string().nonempty(),
  chains: z.array(z.string()).nonempty(),
  address: z
    .string()
    .nonempty()
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "address is not a valid address"
    ),
  memo: memoSchema,
});

export type StakeAppBody = z.infer<typeof StakeAppBody>;

const UnstakeAppBody = z.object({
  address: z
    .string()
    .nonempty()
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "address is not a valid address"
    ),
  memo: memoSchema,
});

export type UnstakeAppBody = z.infer<typeof UnstakeAppBody>;

const ChangeParamBody = z.object({
  address: z
    .string()
    .nonempty()
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "address is not a valid address"
    ),
  paramKey: z.string().nonempty(),
  paramValue: z.string().nonempty(),
  overrideGovParamsWhitelistValidation: z.boolean().optional().default(false),
  memo: memoSchema,
});

export type ChangeParamBody = z.infer<typeof ChangeParamBody>;

const UnstakeNodeBody = z.object({
  address: z
    .string()
    .nonempty()
    .refine(
      (value) => isValidAddress(value, PocketProtocol),
      "address is not a valid address"
    ),
  nodeAddress: z
    .string()
    .nonempty()
    .optional()
    .refine(
      (value) => !value || isValidAddress(value, PocketProtocol),
      "address is not a valid address"
    ),
  memo: memoSchema,
});

export type UnstakeNodeBody = z.infer<typeof UnstakeNodeBody>;

// Controller to manage the communication between the webpages and the content script
class ProxyCommunicationController {
  private _sessionByProtocol: Partial<
    Record<SupportedProtocols, PartialSession>
  > = {};
  private _backgroundIsReady = false;

  constructor() {
    this._checkLastSession();
    this._checkAppIsReady().catch();

    window.addEventListener(
      "message",
      async (event: MessageEvent<ProxyRequests>) => {
        const { data, origin } = event;

        if (
          origin === window.location.origin &&
          data?.to === "VAULT_KEYRING" &&
          Object.values(supportedProtocolsArray).includes(data.protocol)
        ) {
          if (!this._backgroundIsReady) {
            return window.postMessage({
              to: "VAULT_KEYRING",
              type: APP_IS_NOT_READY,
              protocol: data.protocol,
              id: data.id,
            });
          }

          if (data.type === CONNECTION_REQUEST_MESSAGE) {
            await this._sendConnectionRequest(data.protocol, data.id);
          }

          if (data.type === TRANSFER_REQUEST) {
            await this._sendTransferRequest(data.protocol, data.id, data.data);
          }

          if (data.type === LIST_ACCOUNTS_REQUEST) {
            await this._handleListAccountsRequest(data.protocol, data.id);
          }

          if (data.type === EXTERNAL_ACCOUNT_BALANCE_REQUEST) {
            await this._handleBalanceRequest(
              data.protocol,
              data.id,
              data.data?.address,
              data.data?.block
            );
          }

          if (data.type === SELECTED_CHAIN_REQUEST) {
            await this._handleGetSelectedChain(data.protocol, data.id);
          }

          if (
            data.type === GET_POKT_TRANSACTION_REQUEST &&
            data.protocol === PocketProtocol
          ) {
            await this._getPoktTx(data.data?.hash, data.id);
          }

          if (data.type === SWITCH_CHAIN_REQUEST) {
            await this._sendSwitchChainRequest(
              data.protocol,
              data.id,
              data.data?.chainId
            );
          }

          if (data.type === SIGN_TYPED_DATA_REQUEST) {
            await this._sendSignTypedDataRequest(
              data.protocol,
              data.id,
              data.data
            );
          }

          if (data.type === PERSONAL_SIGN_REQUEST) {
            await this._sendPersonalSignRequest(
              data.protocol,
              data.id,
              data.data
            );
          }

          if (data.type === PUBLIC_KEY_REQUEST) {
            await this._sendPublicKeyRequest(
              data.protocol,
              data.id,
              data.data?.address
            );
          }

          if (data.type === STAKE_NODE_REQUEST) {
            await this._sendPoktTxRequest(
              data.protocol,
              data.id,
              data.data,
              StakeNodeBody,
              STAKE_NODE_REQUEST,
              STAKE_NODE_RESPONSE
            );
          }

          if (data.type === UNSTAKE_NODE_REQUEST) {
            await this._sendPoktTxRequest(
              data.protocol,
              data.id,
              data.data,
              UnstakeNodeBody,
              UNSTAKE_NODE_REQUEST,
              UNSTAKE_NODE_RESPONSE
            );
          }

          if (data.type === UNJAIL_NODE_REQUEST) {
            await this._sendPoktTxRequest(
              data.protocol,
              data.id,
              data.data,
              UnstakeNodeBody,
              UNJAIL_NODE_REQUEST,
              UNJAIL_NODE_RESPONSE
            );
          }

          if (data.type === STAKE_APP_REQUEST) {
            await this._sendPoktTxRequest(
              data.protocol,
              data.id,
              data.data,
              StakeAppBody,
              STAKE_APP_REQUEST,
              STAKE_APP_RESPONSE
            );
          }

          if (data.type === CHANGE_PARAM_REQUEST) {
            await this._sendPoktTxRequest(
              data.protocol,
              data.id,
              data.data,
              ChangeParamBody,
              CHANGE_PARAM_REQUEST,
              CHANGE_PARAM_RESPONSE
            );
          }

          if (data.type === DAO_TRANSFER_REQUEST) {
            await this._sendPoktTxRequest(
              data.protocol,
              data.id,
              data.data,
              DaoTransferBody as any,
              DAO_TRANSFER_REQUEST,
              DAO_TRANSFER_RESPONSE
            );
          }

          if (data.type === UPGRADE_REQUEST) {
            await this._sendPoktTxRequest(
              data.protocol,
              data.id,
              data.data,
              UpgradeBody as any,
              UPGRADE_REQUEST,
              UPGRADE_RESPONSE
            );
          }

          if (data.type === BULK_SIGN_TRANSACTION_REQUEST) {
            await this._sendSignTxRequest(
              data.protocol,
              data.id,
              {
                // @ts-ignore
                transactions: data.data,
              },
              data.type
            );
          }

          if (data.type === SIGN_TRANSACTION_REQUEST) {
            await this._sendSignTxRequest(
              data.protocol,
              data.id,
              {
                // @ts-ignore
                transactions: data.data,
              },
              data.type
            );
          }
        }
      }
    );

    browser.runtime.onMessage.addListener(
      async (message: InternalResponses) => {
        if (!message?.type) {
          return;
        }

        if (message.type === CONNECTION_RESPONSE_MESSAGE) {
          await this._handleConnectionResponse(message);
        }

        if (message.type === TRANSFER_RESPONSE) {
          await this._handleTransferResponse(message);
        }

        if (
          [
            STAKE_NODE_RESPONSE,
            UNSTAKE_NODE_RESPONSE,
            UNJAIL_NODE_RESPONSE,
            STAKE_APP_RESPONSE,
            TRANSFER_APP_RESPONSE,
            UNSTAKE_APP_RESPONSE,
            CHANGE_PARAM_RESPONSE,
            DAO_TRANSFER_RESPONSE,
            UPGRADE_RESPONSE,
          ].includes(message.type)
        ) {
          await this._handlePoktTxResponse(
            message as InternalResponse<typeof message.type>
          );
        }

        if (message.type === BULK_SIGN_TRANSACTION_RESPONSE) {
          await this._handleSignTxResponse(message);
        }

        if (message.type === DISCONNECT_RESPONSE) {
          this._handleDisconnect(message.data?.protocol);
        }

        if (message.type === SWITCH_CHAIN_RESPONSE) {
          this._sendSwitchChainResponse(message.requestId, message.error);
        }

        if (message.type === SIGN_TYPED_DATA_RESPONSE) {
          this._handleSignTypedDataResponse(message);
        }

        if (message.type === PERSONAL_SIGN_RESPONSE) {
          this._handlePersonalSignResponse(message);
        }

        if (message.type === PUBLIC_KEY_RESPONSE) {
          this._handlePublicKeyResponse(message);
        }

        if (message.type === SELECTED_ACCOUNT_CHANGED) {
          this._sendMessageAccountsChanged({
            protocol: message.protocol,
            addresses: message.data.addresses,
          });
        }
        if (message.type === SELECTED_CHAIN_CHANGED) {
          this._sendMessageChainChanged(message);
        }
      }
    );
  }

  private async _checkAppIsReady() {
    try {
      if (this._backgroundIsReady) return;

      const message: BackgroundAppIsReadyReq = {
        type: APP_IS_READY_REQUEST,
      };
      const response: BackgroundAppIsReadyRes =
        await browser.runtime.sendMessage(message);

      if (response?.data?.isReady) {
        this._backgroundIsReady = true;
        for (const protocol of Object.values(supportedProtocolsArray)) {
          setTimeout(() => {
            const message: AppIsReadyMessageToProvider = {
              from: "VAULT_KEYRING",
              type: APP_IS_READY,
              protocol: protocol,
              data: {
                chainId: response.data.chainByProtocol[protocol],
              },
            };
            window.postMessage(message, window.location.origin);
          }, 1000);
        }
      } else {
        await this._checkAppIsReady();
      }
    } catch (e) {
      await this._checkAppIsReady();
    }
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

  private _sendMessageChainChanged(message: ChainChangedMessageToProxy) {
    const messageToProvider: ChainChangedToProvider = {
      from: "VAULT_KEYRING",
      type: SELECTED_CHAIN_CHANGED,
      protocol: message.protocol,
      data: message.data,
    };
    window.postMessage(messageToProvider, window.location.origin);
  }

  private async _sendConnectionRequest(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    let requestWasSent = false;
    try {
      const session = this._sessionByProtocol[protocol];
      if (session) {
        const message: ExternalIsSessionValidReq = {
          type: IS_SESSION_VALID_REQUEST,
          data: {
            sessionId: session.id,
            origin: window.location.origin,
          },
        };

        const messageResponse: ExternalIsSessionValidRes =
          await browser.runtime.sendMessage(message);

        if (messageResponse?.data?.isValid) {
          const message: ExternalListAccountsReq = {
            type: LIST_ACCOUNTS_REQUEST,
            requestId,
            data: {
              sessionId: session?.id,
              origin: window.location.origin,
              protocol,
            },
          };
          const response: ExternalListAccountsRes =
            await browser.runtime.sendMessage(message);

          if (response?.data?.accounts) {
            return this._sendConnectionResponse(
              response?.requestId,
              response?.data?.accounts
            );
          }
        }
      }

      const message: ExternalConnectionReq = {
        type: CONNECTION_REQUEST_MESSAGE,
        requestId,
        data: {
          origin: window.location.origin,
          faviconUrl: this._getFaviconUrl(),
          protocol,
        },
      };

      const response: ExternalConnectionResToProxy =
        await browser.runtime.sendMessage(message);
      requestWasSent = true;

      if (response?.type === CONNECTION_RESPONSE_MESSAGE) {
        await this._handleConnectionResponse(response, requestId);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendConnectionResponse(requestId, null, UnknownError);
      }
    }
  }

  private async _handleConnectionResponse(
    extensionResponse: InternalConnectionRes,
    idFromRequest?: string
  ) {
    try {
      const { error, data, requestId } = extensionResponse;

      if (data) {
        const { accepted, session, protocol } = data;

        if (accepted && session) {
          this._sessionByProtocol[protocol] = session;

          await browser.storage.local.set({
            [`${window.location.origin}-session-${protocol}`]: session,
          });

          this._sendConnectionResponse(requestId, data.addresses);
          this._sendMessageAccountsChanged({
            protocol,
            addresses: data.addresses,
          });
        } else {
          this._sendConnectionResponse(requestId, null, OperationRejected);
        }
      } else {
        this._sendConnectionResponse(requestId, null, error);
      }
    } catch (e) {
      this._sendConnectionResponse(idFromRequest, null, UnknownError);
    }
  }

  private _sendConnectionResponse(
    requestId: string,
    addresses: string[] | null,
    error: ProxyConnectionErrors = null
  ) {
    try {
      let response: ProxyConnectionRes;

      if (error) {
        response = {
          type: CONNECTION_RESPONSE_MESSAGE,
          from: "VAULT_KEYRING",
          data: null,
          error,
          id: requestId,
        };
      } else {
        response = {
          type: CONNECTION_RESPONSE_MESSAGE,
          from: "VAULT_KEYRING",
          error: null,
          data: addresses,
          id: requestId,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          type: CONNECTION_RESPONSE_MESSAGE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
          id: requestId,
        } as ProxyConnectionRes,
        window.location.origin
      );
    }
  }

  private _checkLastSession() {
    try {
      browser.storage.local
        .get({
          [`${window.location.origin}-session-${PocketProtocol}`]: null,
          [`${window.location.origin}-session-${EthereumProtocol}`]: null,
          [`${window.location.origin}-session-${CosmosProtocol}`]: null,
        })
        .then(async (response) => {
          const checkSession = async (protocol: SupportedProtocols) => {
            const session =
              response[`${window.location.origin}-session-${protocol}`];
            if (session) {
              const message: ExternalIsSessionValidReq = {
                type: IS_SESSION_VALID_REQUEST,
                data: {
                  sessionId: session.id,
                  origin: window.location.origin,
                },
              };

              const messageResponse: ExternalIsSessionValidRes =
                await browser.runtime.sendMessage(message);
              if (
                messageResponse?.type === IS_SESSION_VALID_RESPONSE &&
                messageResponse?.data
              ) {
                const isValid = messageResponse?.data?.isValid;

                if (isValid) {
                  this._sessionByProtocol[protocol] = session;
                } else {
                  if (typeof isValid === "boolean") {
                    await browser.storage.local.remove(
                      `${window.location.origin}-session-${protocol}`
                    );
                  }
                }
              }
            }
          };

          await Promise.allSettled([
            checkSession(EthereumProtocol),
            checkSession(PocketProtocol),
            checkSession(CosmosProtocol),
          ]);
        });
    } catch (e) {}
  }

  private async _sendTransferRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxyTransferReq["data"]
  ) {
    let requestWasSent = false;
    try {
      const session = this._sessionByProtocol[protocol];
      if (session) {
        let transferData: TPocketTransferBody | TEthTransferBody;

        if (!data?.from) {
          return this._sendTransferResponse(
            requestId,
            null,
            propertyIsNotValid("from")
          );
        }

        if (!data?.to) {
          return this._sendTransferResponse(
            requestId,
            null,
            propertyIsNotValid("to")
          );
        }

        if (protocol === PocketProtocol) {
          if (!(data as TPocketTransferBody)?.amount) {
            return this._sendTransferResponse(
              requestId,
              null,
              propertyIsNotValid("amount")
            );
          }
        }

        try {
          if (protocol === PocketProtocol) {
            transferData = PocketTransferBody.parse(data);
          } else {
            transferData = EthTransferBody.parse(data);
          }
        } catch (e) {
          const zodError: ZodError = e;
          const path = zodError?.issues?.[0]?.path?.[0];

          const errorToReturn = propertyIsNotValid(path as string);
          return this._sendTransferResponse(requestId, null, errorToReturn);
        }

        const message: ExternalTransferReq = {
          type: TRANSFER_REQUEST,
          requestId,
          data: {
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId: session.id,
            protocol,
            transferData,
          },
        };

        const response: ExternalTransferResToProxy =
          await browser.runtime.sendMessage(message);

        requestWasSent = true;

        if (response?.type === TRANSFER_RESPONSE) {
          await this._handleTransferResponse(response);
        }
      } else {
        return this._sendTransferResponse(requestId, null, UnauthorizedError);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendTransferResponse(requestId, null, UnknownError);
      }
    }
  }

  private async _handleTransferResponse(response: TransferResponseFromBack) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        if (data.rejected) {
          this._sendTransferResponse(requestId, null, OperationRejected);
        } else {
          this._sendTransferResponse(requestId, data);
        }
      } else {
        this._sendTransferResponse(requestId, null, error);

        if (error?.isSessionInvalid) {
          this._handleDisconnect(response.data.protocol);
        }
      }
    } catch (e) {
      this._sendTransferResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendTransferResponse(
    requestId: string,
    data: TransferResponseFromBack["data"],
    error: ProxyTransferError = null
  ) {
    try {
      let response: ProxyTransferRes;

      if (error) {
        response = {
          id: requestId,
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: data.hash,
          error: null,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          from: "VAULT_KEYRING",
          type: "TRANSFER_RESPONSE",
          data: null,
          error: UnknownError,
        } as ProxyTransferRes,
        window.location.origin
      );
    }
  }

  private _handleDisconnect(protocol: SupportedProtocols) {
    try {
      this._sessionByProtocol[protocol] = null;
      this._sendMessageAccountsChanged({
        protocol,
        addresses: [],
      });
    } catch (e) {}
  }

  private async _handleListAccountsRequest(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    try {
      let proxyResponse: ProxyListAccountsRes;

      const session = this._sessionByProtocol[protocol];

      const message: ExternalListAccountsReq = {
        type: LIST_ACCOUNTS_REQUEST,
        requestId,
        data: {
          sessionId: session?.id,
          origin: window.location.origin,
          protocol,
        },
      };
      const response: ExternalListAccountsRes =
        await browser.runtime.sendMessage(message);

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: LIST_ACCOUNTS_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: LIST_ACCOUNTS_RESPONSE,
          error: null,
          data: response?.data?.accounts,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);
    } catch (e) {
      const message: ProxyListAccountsRes = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: LIST_ACCOUNTS_RESPONSE,
        error: UnknownError,
        data: null,
      };
      window.postMessage(message, window.location.origin);
    }
  }

  private async _handleBalanceRequest(
    protocol: SupportedProtocols,
    requestId: string,
    address: string,
    block?: string
  ) {
    try {
      if (!address || !isValidAddress(address, protocol)) {
        const message: ProxyBalanceRes = {
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          data: null,
          error: propertyIsNotValid("address"),
          id: requestId,
        };
        return window.postMessage(message, window.location.origin);
      }

      if (block && protocol === EthereumProtocol && block !== "latest") {
        return window.postMessage(
          {
            from: "VAULT_KEYRING",
            type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
            data: null,
            error: BlockNotSupported,
            id: requestId,
          } as ProxyBalanceRes,
          window.location.origin
        );
      }

      const message: ExternalBalanceReq = {
        type: EXTERNAL_ACCOUNT_BALANCE_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
          address,
        },
      };
      const response: ExternalBalanceRes = await browser.runtime.sendMessage(
        message
      );

      let proxyResponse: ProxyBalanceRes;

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          error: null,
          data: response?.data?.balance,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          from: "VAULT_KEYRING",
          type: EXTERNAL_ACCOUNT_BALANCE_RESPONSE,
          data: null,
          error: UnknownError,
          id: requestId,
        } as ProxyBalanceRes,
        window.location.origin
      );
    }
  }

  private async _handleGetSelectedChain(
    protocol: SupportedProtocols,
    requestId: string
  ) {
    let proxyResponse: ProxySelectedChainRes;

    try {
      const message: ExternalSelectedChainReq = {
        type: SELECTED_CHAIN_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
        },
      };
      const response: ExternalSelectedChainRes =
        await browser.runtime.sendMessage(message);

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: SELECTED_CHAIN_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: SELECTED_CHAIN_RESPONSE,
          error: null,
          data: response?.data?.chainId,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);
    } catch (e) {
      proxyResponse = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: SELECTED_CHAIN_RESPONSE,
        data: null,
        error: UnknownError,
      };
      window.postMessage(proxyResponse, window.location.origin);
    }
  }

  private async _getPoktTx(hash: string, requestId: string) {
    let proxyResponse: ProxyGetPoktTxRes;
    try {
      const message: ExternalGetPoktTxReq = {
        type: GET_POKT_TRANSACTION_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          hash,
        },
      };
      const response: ExternalGetPoktTxRes = await browser.runtime.sendMessage(
        message
      );

      if (response?.error) {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: GET_POKT_TRANSACTION_RESPONSE,
          error: response?.error,
          data: null,
        };
      } else {
        proxyResponse = {
          id: response.requestId || requestId,
          from: "VAULT_KEYRING",
          type: GET_POKT_TRANSACTION_RESPONSE,
          error: null,
          data: response?.data,
        };
      }

      window.postMessage(proxyResponse, window.location.origin);
    } catch (e) {
      proxyResponse = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: GET_POKT_TRANSACTION_RESPONSE,
        data: null,
        error: UnknownError,
      };
      window.postMessage(proxyResponse, window.location.origin);
    }
  }

  private async _sendSwitchChainRequest(
    protocol: SupportedProtocols,
    requestId: string,
    chainId: string
  ) {
    try {
      if (!chainId) {
        return this._sendSwitchChainResponse(
          requestId,
          propertyIsRequired("chainId")
        );
      }
      const message: ExternalSwitchChainReq = {
        type: SWITCH_CHAIN_REQUEST,
        requestId,
        data: {
          origin: window.location.origin,
          protocol,
          chainId,
          faviconUrl: this._getFaviconUrl(),
        },
      };

      const response: ExternalSwitchChainResToProxy =
        await browser.runtime.sendMessage(message);

      if (response?.type === SWITCH_CHAIN_RESPONSE) {
        this._sendSwitchChainResponse(
          response.requestId || requestId,
          response.error
        );
      }
    } catch (e) {
      const message: ProxySwitchChainRes = {
        id: requestId,
        from: "VAULT_KEYRING",
        type: SWITCH_CHAIN_RESPONSE,
        data: null,
        error: UnknownError,
      };
      window.postMessage(message, window.location.origin);
    }
  }

  private _sendSwitchChainResponse(requestId: string, error?) {
    try {
      let response: ProxySwitchChainRes;

      if (error) {
        response = {
          id: requestId,
          type: SWITCH_CHAIN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: SWITCH_CHAIN_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: null,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: SWITCH_CHAIN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxySwitchChainRes,
        window.location.origin
      );
    }
  }

  private _sendMessageAccountsChanged(param: {
    protocol: SupportedProtocols;
    addresses: string[];
  }) {
    const message: AccountsChangedToProvider = {
      from: "VAULT_KEYRING",
      type: SELECTED_ACCOUNT_CHANGED,
      protocol: param.protocol,
      data: {
        addresses: param.addresses,
      },
    };
    window.postMessage(message, window.location.origin);
  }

  private async _sendSignTypedDataRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxySignTypedDataReq["data"]
  ) {
    try {
      const sessionId = this._sessionByProtocol[protocol]?.id;

      if (sessionId) {
        if (!isValidAddress(data.address, protocol)) {
          this._sendSignTypedResponse(
            requestId,
            null,
            propertyIsNotValid("address")
          );
        }

        let dataToSign: ProxySignTypedDataReq["data"]["data"] = data.data;

        if (typeof data.data === "string") {
          try {
            dataToSign = JSON.parse(data.data);
          } catch (e) {
            return this._sendSignTypedResponse(
              requestId,
              null,
              propertyIsNotValid("data")
            );
          }
        }

        const err = validateTypedDataPayload(dataToSign);

        if (err) {
          return this._sendSignTypedResponse(requestId, null, err);
        }

        const message: ExternalSignTypedDataReq = {
          type: SIGN_TYPED_DATA_REQUEST,
          requestId,
          data: {
            address: data.address,
            data: dataToSign,
            protocol,
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId,
          },
        };

        const response: ExternalSignTypedDataResToProxy =
          await browser.runtime.sendMessage(message);

        if (response?.type === SIGN_TYPED_DATA_RESPONSE) {
          this._sendSignTypedResponse(
            response.requestId || requestId,
            null,
            response.error
          );

          if (response?.error?.isSessionInvalid) {
            this._handleDisconnect(protocol);
          }
        }
      } else {
        return this._sendSignTypedResponse(requestId, null, UnauthorizedError);
      }
    } catch (e) {
      this._sendSignTypedResponse(requestId, null, UnknownError);
    }
  }

  private _handleSignTypedDataResponse(response: InternalSignedTypedDataRes) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        this._sendSignTypedResponse(requestId, data.sign);
      } else {
        this._sendSignTypedResponse(requestId, null, error);
      }
    } catch (e) {
      this._sendSignTypedResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendSignTypedResponse(
    requestId: string,
    stringSigned: string | null,
    error?: ProxySignedTypedDataErrors
  ) {
    try {
      let response: ProxySignedTypedDataRes;

      if (error) {
        response = {
          id: requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: stringSigned,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: SIGN_TYPED_DATA_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxySignedTypedDataRes,
        window.location.origin
      );
    }
  }

  private async _sendPersonalSignRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxyPersonalSignReq["data"]
  ) {
    try {
      const sessionId = this._sessionByProtocol[protocol]?.id;

      if (sessionId) {
        if (!isValidAddress(data.address, protocol)) {
          this._sendPersonalSignResponse(
            requestId,
            null,
            propertyIsNotValid("address")
          );
        }

        if (
          protocol === EthereumProtocol &&
          !stringRegex.test(data?.challenge)
        ) {
          this._sendPersonalSignResponse(
            requestId,
            null,
            propertyIsNotValid("challenge")
          );
        }

        const message: ExternalPersonalSignReq = {
          type: PERSONAL_SIGN_REQUEST,
          requestId,
          data: {
            ...data,
            protocol,
            sessionId,
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
          },
        };

        const response: ExternalPersonalSignResToProxy =
          await browser.runtime.sendMessage(message);

        if (response?.type === PERSONAL_SIGN_RESPONSE) {
          this._sendPersonalSignResponse(
            response.requestId || requestId,
            null,
            response.error
          );

          if (response?.error?.isSessionInvalid) {
            this._handleDisconnect(protocol);
          }
        }
      } else {
        return this._sendPersonalSignResponse(
          requestId,
          null,
          UnauthorizedError
        );
      }
    } catch (e) {
      this._sendPersonalSignResponse(requestId, null, UnknownError);
    }
  }

  private _handlePersonalSignResponse(response: InternalPersonalSignRes) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        this._sendPersonalSignResponse(requestId, data.sign);
      } else {
        this._sendPersonalSignResponse(requestId, null, error);
      }
    } catch (e) {
      this._sendPersonalSignResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendPersonalSignResponse(
    requestId: string,
    stringSigned: string | null,
    error?
  ) {
    try {
      let response: ProxyPersonalSignRes;

      if (error) {
        response = {
          id: requestId,
          type: PERSONAL_SIGN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: PERSONAL_SIGN_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: stringSigned,
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: PERSONAL_SIGN_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxyPersonalSignRes,
        window.location.origin
      );
    }
  }

  private async _sendPublicKeyRequest(
    protocol: SupportedProtocols,
    requestId: string,
    address: string
  ) {
    try {
      const sessionId = this._sessionByProtocol[protocol]?.id;
      if (!sessionId) {
        return this._sendPublicKeyResponse(requestId, null, UnauthorizedError);
      }

      if (!address) {
        return this._sendPublicKeyResponse(
          requestId,
          null,
          propertyIsRequired("address")
        );
      }

      if (!isValidAddress(address, protocol)) {
        return this._sendPublicKeyResponse(
          requestId,
          null,
          propertyIsNotValid("address")
        );
      }

      const message: ExternalPublicKeyReq = {
        type: PUBLIC_KEY_REQUEST,
        requestId,
        data: {
          sessionId,
          origin: window.location.origin,
          protocol,
          address,
          faviconUrl: this._getFaviconUrl(),
        },
      };

      const response: ExternalPublicKeyResToProxy =
        await browser.runtime.sendMessage(message);

      if (response && response?.type === PUBLIC_KEY_RESPONSE) {
        this._sendPublicKeyResponse(
          requestId,
          response?.data?.publicKey,
          response?.error
        );
      }
    } catch (e) {
      this._sendPublicKeyResponse(requestId, null, UnknownError);
    }
  }

  private _handlePublicKeyResponse(response: InternalPublicKeyRes) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        this._sendPublicKeyResponse(requestId, data.publicKey);
      } else {
        this._sendPublicKeyResponse(requestId, null, error);
      }
    } catch (e) {
      this._sendPublicKeyResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendPublicKeyResponse(
    requestId: string,
    publicKey: string | null,
    error?
  ) {
    try {
      let response: ProxyPublicKeyRes;

      if (error) {
        response = {
          id: requestId,
          type: PUBLIC_KEY_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: PUBLIC_KEY_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: {
            publicKey,
          },
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: PUBLIC_KEY_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxyPublicKeyRes,
        window.location.origin
      );
    }
  }

  private async _sendPoktTxRequest<
    D extends object,
    V extends z.ZodObject<any>,
    EReq extends {
      type: string;
      requestId: string;
      data: {
        origin: string;
        faviconUrl: string;
        sessionId: string;
        protocol: SupportedProtocols;
        transactionData: z.infer<V>;
      };
    },
    TRes extends string,
    ERes extends ExternalResponse<TRes>,
    PRes extends ProxyPoktTxRes<TRes>
  >(
    protocol: SupportedProtocols,
    requestId: string,
    data: D,
    validator: V,
    requestType: EReq["type"],
    responseType: Extract<ERes, { data: null }>["type"]
  ) {
    let requestWasSent = false;

    try {
      if (protocol !== PocketProtocol) {
        return this._sendPoktTxResponse<typeof responseType, PRes>(
          responseType,
          requestId,
          null,
          UnsupportedMethod
        );
      }

      const sessionId = this._sessionByProtocol[protocol]?.id;
      if (sessionId) {
        let transactionData: z.infer<V>;

        if (!data) {
          return this._sendPoktTxResponse<typeof responseType, PRes>(
            responseType,
            requestId,
            null,
            propertyIsNotValid("params")
          );
        }

        try {
          transactionData = validator.parse(data);
        } catch (e) {
          const zodError: ZodError = e;
          const path = zodError?.issues?.[0]?.path?.[0] as string;

          const errorToReturn = !data?.[path]
            ? propertyIsRequired(zodError?.issues?.[0]?.path?.join(".") || path)
            : propertyIsNotValid(
                zodError?.issues?.[0]?.path?.join(".") || path
              );
          return this._sendPoktTxResponse<typeof responseType, PRes>(
            responseType,
            requestId,
            null,
            errorToReturn
          );
        }

        const message = {
          type: requestType,
          requestId,
          data: {
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId,
            protocol,
            transactionData,
          },
        } as EReq;

        const response: ERes = await browser.runtime.sendMessage(message);

        requestWasSent = true;

        if (response && response?.type === responseType) {
          this._sendPoktTxResponse<typeof responseType, PRes>(
            responseType,
            requestId,
            null,
            response.error
          );

          if (response?.error?.isSessionInvalid) {
            this._handleDisconnect(protocol);
          }
        }
      } else {
        return this._sendPoktTxResponse<typeof responseType, PRes>(
          responseType,
          requestId,
          null,
          UnauthorizedError
        );
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendPoktTxResponse<typeof responseType, PRes>(
          responseType,
          requestId,
          null,
          UnknownError
        );
      }
    }
  }

  private async _handlePoktTxResponse<T extends string>(
    response: InternalResponse<T>
  ) {
    try {
      const { error, data, requestId, type } = response;

      if (data) {
        if (data.rejected) {
          this._sendPoktTxResponse<typeof type, ProxyPoktTxRes<typeof type>>(
            response.type,
            requestId,
            null,
            OperationRejected
          );
        } else {
          this._sendPoktTxResponse<typeof type, ProxyPoktTxRes<typeof type>>(
            response.type,
            requestId,
            data.hash,
            null
          );
        }
      } else {
        this._sendPoktTxResponse<typeof type, ProxyPoktTxRes<typeof type>>(
          response.type,
          requestId,
          null,
          error
        );

        // @ts-ignore
        if (error?.isSessionInvalid) {
          this._handleDisconnect(response.data.protocol);
        }
      }
    } catch (e) {
      this._sendPoktTxResponse<
        typeof response.type,
        ProxyPoktTxRes<typeof response.type>
      >(response.type, response?.requestId, null, UnknownError);
    }
  }

  private _sendPoktTxResponse<
    Type extends string,
    T extends ProxyPoktTxRes<Type>
  >(
    proxyResponseType: Type,
    requestId: string,
    hash: string | null,
    error: ExternalBasePoktTxErrors | null
  ) {
    try {
      let response: T;

      if (error) {
        response = {
          id: requestId,
          type: proxyResponseType,
          from: "VAULT_KEYRING",
          data: null,
          error,
        } as T;
      } else {
        response = {
          id: requestId,
          type: proxyResponseType,
          from: "VAULT_KEYRING",
          error: null,
          data: {
            hash,
          },
        } as T;
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: proxyResponseType,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as T,
        window.location.origin
      );
    }
  }

  private async _sendSignTxRequest(
    protocol: SupportedProtocols,
    requestId: string,
    data: ProxyBulkSignTransactionReq["data"],
    type?: ProxyBulkSignTransactionReq["type"]
  ) {
    let requestWasSent = false;

    try {
      const sessionId = this._sessionByProtocol[protocol]?.id;
      if (sessionId) {
        const dataValidated: ExternalBulkSignTransactionReq["data"]["data"]["transactions"] =
          [];

        if (!data?.transactions?.length) {
          return this._sendSignTxResponse(
            requestId,
            null,
            propertyIsNotValid("params")
          );
        }

        if (type === SIGN_TRANSACTION_REQUEST && data.transactions.length > 1) {
          return this._sendSignTxResponse(
            requestId,
            null,
            SignTransactionOnlyAcceptsOne
          );
        }

        try {
          for (const item of data.transactions) {
            if (item.protocol === PocketProtocol) {
              const { id, type, transaction } = item;
              let schema:
                | typeof StakeAppBody
                | typeof TransferAppBody
                | typeof UnstakeAppBody
                | typeof PocketTransferBody
                | typeof UpgradeBody
                | typeof StakeNodeBody
                | typeof ChangeParamBody
                | typeof UnstakeNodeBody
                | typeof DaoTransferBody;
              switch (type) {
                case "app_stake":
                  schema = StakeAppBody;
                  break;
                case "app_transfer":
                  schema = TransferAppBody;
                  break;
                case "app_unstake":
                  schema = UnstakeAppBody;
                  break;
                case "send":
                  schema = PocketTransferBody;
                  break;
                case "gov_dao_transfer":
                  schema = DaoTransferBody;
                  break;
                case "gov_change_param":
                  schema = ChangeParamBody;
                  break;
                case "gov_upgrade":
                  schema = UpgradeBody;
                  break;
                case "node_stake":
                  schema = StakeNodeBody;
                  break;
                case "node_unjail":
                  schema = UnstakeNodeBody;
                  break;
                case "node_unstake":
                  schema = UnstakeNodeBody;
                  break;
                default:
                  return this._sendSignTxResponse(
                    requestId,
                    null,
                    propertyIsNotValid("type")
                  );
              }

              dataValidated.push({
                type,
                id,
                transaction: schema.parse(transaction),
                protocol: item.protocol,
              } as ExternalBulkSignTransactionReq["data"]["data"]["transactions"][number]);
            } else if (item.protocol === CosmosProtocol) {
              dataValidated.push(item);
            } else {
              return this._sendSignTxResponse(
                requestId,
                null,
                UnsupportedMethod
              );
            }
          }
        } catch (e) {
          const zodError: ZodError = e;
          const path = zodError?.issues?.[0]?.path?.[0] as string;

          const errorToReturn = !data?.[path]
            ? propertyIsRequired(zodError?.issues?.[0]?.path?.join(".") || path)
            : propertyIsNotValid(
                zodError?.issues?.[0]?.path?.join(".") || path
              );
          return this._sendSignTxResponse(requestId, null, errorToReturn);
        }

        const message: ExternalBulkSignTransactionReq = {
          type: BULK_SIGN_TRANSACTION_REQUEST,
          requestId,
          data: {
            origin: window.location.origin,
            faviconUrl: this._getFaviconUrl(),
            sessionId,
            protocol,
            data: {
              transactions: dataValidated,
            },
          },
        };

        const response: ExternalBulkSignTransactionRes =
          await browser.runtime.sendMessage(message);

        requestWasSent = true;

        if (response && response?.type === BULK_SIGN_TRANSACTION_RESPONSE) {
          this._sendSignTxResponse(requestId, null, response.error);

          if (response?.error?.isSessionInvalid) {
            this._handleDisconnect(protocol);
          }
        }
      } else {
        return this._sendSignTxResponse(requestId, null, UnauthorizedError);
      }
    } catch (e) {
      if (!requestWasSent) {
        this._sendSignTxResponse(requestId, null, UnknownError);
      }
    }
  }

  private async _handleSignTxResponse(
    response: InternalBulkSignTransactionRes
  ) {
    try {
      const { error, data, requestId } = response;

      if (data) {
        if (data.rejected) {
          this._sendSignTxResponse(requestId, null, OperationRejected);
        } else {
          this._sendSignTxResponse(requestId, data, null);
        }
      } else {
        this._sendSignTxResponse(requestId, null, error);

        // @ts-ignore
        if (error?.isSessionInvalid) {
          this._handleDisconnect(response.data.protocol);
        }
      }
    } catch (e) {
      this._sendSignTxResponse(response?.requestId, null, UnknownError);
    }
  }

  private _sendSignTxResponse(
    requestId: string,
    data: ProxyBulkSignTransactionRes["data"],
    error: ExternalBasePoktTxErrors | null
  ) {
    try {
      let response: ProxyBulkSignTransactionRes;

      if (error) {
        response = {
          id: requestId,
          type: BULK_SIGN_TRANSACTION_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error,
        };
      } else {
        response = {
          id: requestId,
          type: BULK_SIGN_TRANSACTION_RESPONSE,
          from: "VAULT_KEYRING",
          error: null,
          data: {
            signatures: data.signatures,
          },
        };
      }

      window.postMessage(response, window.location.origin);
    } catch (e) {
      window.postMessage(
        {
          id: requestId,
          type: BULK_SIGN_TRANSACTION_RESPONSE,
          from: "VAULT_KEYRING",
          data: null,
          error: UnknownError,
        } as ProxyBulkSignTransactionRes,
        window.location.origin
      );
    }
  }
}

export default ProxyCommunicationController;
