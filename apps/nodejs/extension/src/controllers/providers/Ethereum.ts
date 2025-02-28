import BaseProvider, { EthereumMethod } from "./base";
import { EthereumProtocol } from "../../constants/protocols";

export default class EthereumProvider extends BaseProvider {
  constructor() {
    super(EthereumProtocol);

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
