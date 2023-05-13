import {SupportedProtocols} from "./SupportedProtocols";

export class AccountReference {
  private readonly _address: string = ''
  private readonly _protocol: SupportedProtocols = null
  constructor(address: string, protocol: SupportedProtocols) {
    this._address = address
    this._protocol = protocol
  }
}
