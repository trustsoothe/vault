import {v4, validate} from "uuid";
import IEntity from "../common/IEntity";
import {PocketNetworkProtocol} from "../common/protocols/PocketNetwork/PocketNetworkProtocol";
import {Protocol} from "../common/protocols/Protocol";

export interface AssetOptions {
  name: string
  protocol: Protocol
  symbol: string
  isDefault?: boolean
}

export interface SerializedAsset extends IEntity {
  id: string
  name: string
  symbol: string
  protocol: Protocol,
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export class Asset implements IEntity {
  private readonly _id: string
  private _name: string
  private _symbol: string
  private _createdAt: number
  private _updatedAt: number
  private _protocol: Protocol
  private _isDefault: boolean

  constructor(options: AssetOptions, id?: string) {
    if (id && !validate(id)) {
      throw new Error('Invalid session id: ' + id)
    }

    this._id = id || v4()
    this._name = options.name
    this._protocol = options.protocol
    this._symbol = options.symbol
    this._createdAt = Date.now()
    this._updatedAt = this._createdAt
    this._isDefault = options.isDefault || false
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get symbol(): string {
    return this._symbol
  }

  get createdAt(): number {
    return this._createdAt
  }

  get protocol(): Protocol {
    return this._protocol
  }

  get updatedAt(): number {
    return this._updatedAt
  }

  get isDefault(): boolean {
    return this._isDefault
  }

  serialize(): SerializedAsset {
    return {
      id: this._id,
      name: this._name,
      symbol: this._symbol,
      protocol: this._protocol,
      isDefault: this._isDefault,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  static deserialize(serializedAsset: SerializedAsset): Asset {
    const options: AssetOptions = {
      name: serializedAsset.name,
      protocol: serializedAsset.protocol,
      isDefault: serializedAsset.isDefault,
      symbol: serializedAsset.symbol
    }

    const deserializedAsset = new Asset(options, serializedAsset.id)

    deserializedAsset._createdAt = serializedAsset.createdAt
    deserializedAsset._updatedAt = serializedAsset.updatedAt

    return deserializedAsset
  }
}
