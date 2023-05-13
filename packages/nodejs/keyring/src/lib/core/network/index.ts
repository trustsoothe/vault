import {SupportedProtocols} from "../common/values";
import {v4, validate} from "uuid";

export interface SerializedNetwork {
  id: string
  name: string
  rpcUrl: string
  chainId: string
  protocol: SupportedProtocols,
  createdAt: number
  updatedAt: number
}

export class Network {
  private readonly _id: string
  private _name: string
  private _rpcUrl: string
  private _chainId: string
  private _protocol: SupportedProtocols
  private readonly _createdAt: number
  private _updatedAt: number

  constructor(name: string, rpcUrl: string, chainId: string, protocol: SupportedProtocols, id?: string, createdAt?: number, updatedAt?: number) {
    if (id && validate(id) === false) {
      throw new Error('Invalid network id: ' + id)
    }

    if (!name) {
      throw new Error('Invalid argument name. Expected a non-empty string')
    }

    this._id = id || v4()
    this._name = name
    this._rpcUrl = rpcUrl
    this._chainId = chainId
    this._protocol = protocol
    this._createdAt = createdAt || Date.now()
    this._updatedAt = updatedAt || Date.now()
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get rpcUrl(): string {
    return this._rpcUrl
  }

  get chainId(): string {
    return this._chainId
  }

  get protocol(): SupportedProtocols {
    return this._protocol
  }

  get createdAt(): number {
    return this._createdAt
  }

  get updatedAt(): number {
    return this._updatedAt
  }

  serialize(): SerializedNetwork {
    return {
      id: this._id,
      name: this._name,
      rpcUrl: this._rpcUrl,
      chainId: this._chainId,
      protocol: this._protocol,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }

  static deserialize(serializedNetwork: SerializedNetwork): Network {
    return new Network(
      serializedNetwork.name,
      serializedNetwork.rpcUrl,
      serializedNetwork.chainId,
      serializedNetwork.protocol,
      serializedNetwork.id,
    )
  }
}
