import {v4, validate} from "uuid";
import {SupportedProtocols} from "../common/values";
import IEntity from "../common/IEntity";

export interface SerializedNetwork extends IEntity {
  id: string
  name: string
  rpcUrl: string
  chainId: string
  protocol: SupportedProtocols
  createdAt: number
  updatedAt: number
}

export interface NetworkOptions {
  name: string
  rpcUrl: string
  chainId: string
  protocol: SupportedProtocols
}

export class Network implements IEntity {
  private readonly _id: string
  private readonly _name: string
  private readonly _rpcUrl: string
  private readonly _chainId: string
  private readonly _protocol: SupportedProtocols
  private _createdAt: number
  private _updatedAt: number

  constructor(options: NetworkOptions, id?: string) {
    if (id && validate(id) === false) {
      throw new Error('Invalid session id: ' + id)
    }

    this._id = id || v4()
    this._name = options.name
    this._rpcUrl = options.rpcUrl
    this._chainId = options.chainId
    this._protocol = options.protocol
    this._createdAt = Date.now()
    this._updatedAt = this._createdAt
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
    const options: NetworkOptions = {
      name: serializedNetwork.name,
      rpcUrl: serializedNetwork.rpcUrl,
      chainId: serializedNetwork.chainId,
      protocol: serializedNetwork.protocol,
    }

    const deserializedNetwork = new Network(options, serializedNetwork.id)

    deserializedNetwork._createdAt = serializedNetwork.createdAt
    deserializedNetwork._updatedAt = serializedNetwork.updatedAt

    return deserializedNetwork
  }
}
