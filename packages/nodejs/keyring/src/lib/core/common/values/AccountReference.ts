import {SupportedProtocols} from "./SupportedProtocols";

export interface SerializedAccountReference {
  id: string
  address: string
  protocol: SupportedProtocols
}

export class AccountReference {
  private readonly _id: string = ''
  private readonly _address: string = ''
  private readonly _protocol: SupportedProtocols = null
  constructor(id: string, address: string, protocol: SupportedProtocols) {
    this._id = id
    this._address = address
    this._protocol = protocol
  }

  get id(): string {
    return this._id
  }

  get address(): string {
    return this._address
  }

  get protocol(): SupportedProtocols {
    return this._protocol
  }

  serialize(): SerializedAccountReference {
    return {
      id: this._id,
      address: this._address,
      protocol: this._protocol
    }
  }

  static deserialize(data: SerializedAccountReference): AccountReference {
    return new AccountReference(data.id, data.address, data.protocol)
  }
}
