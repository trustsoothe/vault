import BaseProvider, { PocketNetworkMethod } from "./base";
import { CosmosProtocol } from "../../constants/protocols";

export default class PocketShannonProvider extends BaseProvider {
  constructor() {
    super(CosmosProtocol);

    if (!this._isConnected) {
      setTimeout(() => {
        this.request({
          method: PocketNetworkMethod.CHAIN,
        })
          .then((chainId) => {
            if (chainId && !this._isConnected) {
              this._isConnected = true;
              this.emit("connect", chainId);
            }
          })
          .catch();
      }, 100);
    }
  }
}
