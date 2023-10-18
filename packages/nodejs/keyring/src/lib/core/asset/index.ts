import {v4, validate} from "uuid";
import IEntity from "../common/IEntity";
import {SupportedProtocols} from "../common/values";

export interface AssetOptions {
  name: string
  protocol: SupportedProtocols
  symbol: string
  isDefault?: boolean
  isNative?: boolean
}

export interface SerializedAsset extends IEntity {
  id: string
  name: string
  symbol: string
  protocol: SupportedProtocols
  isDefault: boolean
  isNative: boolean
  createdAt: number
  updatedAt: number
}

export class Asset implements IEntity {
  private readonly _id: string
  private _name: string
  private _symbol: string
  private _createdAt: number
  private _updatedAt: number
  private _protocol: SupportedProtocols
  private _isDefault: boolean
  private _isNative: boolean

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
    this._isNative = options.isNative || true
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

  get protocol(): SupportedProtocols {
    return this._protocol
  }

  get updatedAt(): number {
    return this._updatedAt
  }

  get isDefault(): boolean {
    return this._isDefault
  }

  get isNative(): boolean {
    return this._isNative
  }

  serialize(): SerializedAsset {
    return {
      id: this._id,
      name: this._name,
      symbol: this._symbol,
      protocol: this._protocol,
      isDefault: this._isDefault,
      isNative: this._isNative,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  static deserialize(serializedAsset: SerializedAsset): Asset {
    const options: AssetOptions = {
      name: serializedAsset.name,
      protocol: serializedAsset.protocol,
      isDefault: serializedAsset.isDefault,
      isNative: serializedAsset.isNative,
      symbol: serializedAsset.symbol
    }

    const deserializedAsset = new Asset(options, serializedAsset.id)

    deserializedAsset._createdAt = serializedAsset.createdAt
    deserializedAsset._updatedAt = serializedAsset.updatedAt

    return deserializedAsset
  }
}
