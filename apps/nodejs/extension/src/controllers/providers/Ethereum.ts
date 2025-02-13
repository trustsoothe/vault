import BaseProvider, { EthereumMethod } from "./base";
import { SupportedProtocols } from "@soothe/vault";

export default class EthereumProvider extends BaseProvider {
  constructor() {
    super(SupportedProtocols.Ethereum);

    if (!this._isConnected) {
      this.send(EthereumMethod.CHAIN)
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
