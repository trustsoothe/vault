import {Protocol} from "../Protocol";

export interface SerializedAccountReference {
  id: string
  address: string
  protocol: Protocol
}

export class AccountReference {
  private readonly _id: string = ''
  private readonly _address: string = ''
  private readonly _protocol: Protocol = null

  constructor(id: string, address: string, protocol: Protocol) {
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

  get protocol(): Protocol {
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
