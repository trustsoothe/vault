import BaseProvider, { PocketNetworkMethod } from "./base";
import { PocketProtocol } from "../../constants/protocols";

export default class PocketNetworkProvider extends BaseProvider {
  constructor() {
    super(PocketProtocol);

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
