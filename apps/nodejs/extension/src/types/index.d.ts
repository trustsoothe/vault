import type { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import type { SerializedAccountReference } from "@soothe/vault";
import type { Storage as OriginalStorage } from "webextension-polyfill/namespaces/storage";
import type {
  ProxyBalanceRes,
  ProxyCheckConnectionRequest,
  ProxyConnectionRequest,
  ProxyConnectionRes,
  ProxyDisconnectRequest,
  ProxyDisconnectRes,
  ProxyGetPoktTxRes,
  ProxyListAccountsRequest,
  ProxyListAccountsRes,
  ProxyNewAccountRequest,
  ProxyNewAccountRes,
  ProxySwitchChainRes,
  ProxyTransferRequest,
  ProxyTransferRes,
  ProxyBalanceRequest,
  ProxyGetPoktTxRequest,
  ProxySelectedChainRequest,
  ProxySwitchChainRequest,
} from "./communication";
import type { ArgsOrCallback, Method, MethodOrPayload } from "./provider";
import type { GeneralAppSlice } from "../redux/slices/app";
import type { VaultSlice } from "../redux/slices/vault";
import type { Runtime } from "webextension-polyfill";
import MessageSender = Runtime.MessageSender;
import {
  ProxyPersonalSignRequest,
  ProxySignTypedDataRequest,
} from "./communication";

export type AppSliceBuilder = ActionReducerMapBuilder<GeneralAppSlice>;
export type VaultSliceBuilder = ActionReducerMapBuilder<VaultSlice>;

export interface OutletContext {
  toggleShowCreateAccount: () => void;
}

interface SessionStorage extends OriginalStorage.StorageArea {
  /**
   * The maximum amount (in bytes) of data that can be stored in local storage, as measured by the
   * JSON stringification of every value plus every key's length.
   */
  QUOTA_BYTES: 10485760;
}

declare module "webextension-polyfill" {
  namespace Storage {
    interface Static {
      session: SessionStorage;
    }
  }
}

interface IProvider {
  send: (
    methodOrPayload: MethodOrPayload,
    argsOrCallback?: ArgsOrCallback
  ) => unknown;
  sendAsync: (method: Method, callback: Function) => void;
  request: (args: Method) => unknown;
  isSoothe: true;
}

declare global {
  interface Window {
    pocketNetwork: IProvider;
    pocketShannon: IProvider;
    ethereum: IProvider;
    soothe: {
      connect: () => Promise<ProxyConnectionRes["data"]>;
      disconnect: () => Promise<ProxyDisconnectRes["data"]>;
      checkConnection: () => Promise<ProxyConnectionRes["data"]>;
      listAccounts: () => Promise<ProxyListAccountsRes["data"]>;
      createAccount: (
        data: ProxyNewAccountRequest["data"]
      ) => Promise<ProxyNewAccountRes["data"]>;
      suggestTransfer: (
        data: ProxyTransferRequest["data"]
      ) => Promise<ProxyTransferRes["data"]>;
    };
  }
}

interface AccountWithBalance extends SerializedAccountReference {
  balance?: number;
}

export type BrowserRequest =
  | ProxyConnectionRequest
  | ProxyCheckConnectionRequest
  | ProxyNewAccountRequest
  | ProxyTransferRequest
  | ProxyDisconnectRequest
  | ProxyListAccountsRequest
  | ProxySelectedChainRequest
  | ProxyBalanceRequest
  | ProxyGetPoktTxRequest
  | ProxySwitchChainRequest
  | ProxySignTypedDataRequest
  | ProxyPersonalSignRequest;

export type BrowserResponse =
  | ProxyConnectionRes
  | ProxyListAccountsRes
  | ProxyDisconnectRes
  | ProxyNewAccountRes
  | ProxyTransferRes
  | ProxyBalanceRes
  | ProxyGetPoktTxRes
  | ProxySwitchChainRes;

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: Readonly<IProvider>;
}

type SomeString<T extends string> = T;

export interface ICommunicationController {
  messageForController(messageType: string): boolean;

  onMessageHandler<
    T extends
      | { type: SomeString; data; requestId: string }
      | { type: SomeString; data; requestId?: string }
  >(
    message: T,
    sender: MessageSender
  ): Promise<unknown>;
}
