import BaseProvider, { PocketNetworkMethod } from "./base";
import { SupportedProtocols } from "@poktscan/vault";

export default class PocketNetworkProvider extends BaseProvider {
  constructor() {
    super(SupportedProtocols.Pocket);

    if (!this._isConnected) {
      this.send(PocketNetworkMethod.CHAIN)
        .then((chainId) => {
          if (chainId && !this._isConnected) {
            this._isConnected = true;
            this.emit("connect", chainId);
          }
        })
        .catch();
    }
  }
}
