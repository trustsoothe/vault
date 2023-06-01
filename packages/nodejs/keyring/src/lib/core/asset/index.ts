import {Network, SerializedNetwork} from "../network";
import {v4, validate} from "uuid";
import IEntity from "../common/IEntity";

export interface AssetOptions {
  name: string
  network: Network
  symbol: string
}

export interface SerializedAsset extends IEntity {
  id: string
  name: string
  network: SerializedNetwork
  symbol: string
  createdAt: number
  updatedAt: number
}

export class Asset implements IEntity {
  private readonly _id: string
  private _name: string
  private _network: Network
  private _symbol: string
  private _createdAt: number
  private _updatedAt: number

  constructor(options: AssetOptions, id?: string) {
    if (id && validate(id) === false) {
      throw new Error('Invalid session id: ' + id)
    }

    this._id = id || v4()
    this._name = options.name
    this._network = options.network
    this._symbol = options.symbol
    this._createdAt = Date.now()
    this._updatedAt = this._createdAt
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get network(): Readonly<Network> {
    return this._network
  }

  get symbol(): string {
    return this._symbol
  }

  get createdAt(): number {
    return this._createdAt
  }

  get updatedAt(): number {
    return this._updatedAt
  }

  serialize(): SerializedAsset {
    return {
      id: this._id,
      name: this._name,
      network: this._network.serialize(),
      symbol: this._symbol,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  static deserialize(serializedAsset: SerializedAsset): Asset {
    const options: AssetOptions = {
      name: serializedAsset.name,
      network: Network.deserialize(serializedAsset.network),
      symbol: serializedAsset.symbol
    }

    const deserializedAsset = new Asset(options, serializedAsset.id)

    deserializedAsset._createdAt = serializedAsset.createdAt
    deserializedAsset._updatedAt = serializedAsset.updatedAt

    return deserializedAsset
  }
}
