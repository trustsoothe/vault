import {v4, validate} from "uuid";
import IEntity from "../common/IEntity";
import {SupportedProtocols} from "../common/values";
import {ChainID} from "../common/protocols/ChainID";
import {INetworkOptions} from "./INetworkOptions";

export interface SerializedNetwork extends IEntity {
  id: string
  name: string
  rpcUrl: string
  isDefault: boolean
  isPreferred?: boolean
  protocol: SupportedProtocols
  chainID: string;
  createdAt: number
  updatedAt: number
}

export class Network<T extends SupportedProtocols> {
  private readonly _id: string
  private readonly _name: string
  private readonly _rpcUrl: string
  private readonly _protocol: SupportedProtocols
  private readonly _chainID: string;
  private readonly _isDefault: boolean
  private _isPreferred: boolean
  private _createdAt: number
  private _updatedAt: number

  constructor(options: INetworkOptions<T>, id?: string) {
    if (id && !validate(id)) {
      throw new Error('Invalid session id: ' + id)
    }

    this._id = id || v4()
    this._name = options.name
    this._rpcUrl = options.rpcUrl
    this._protocol = options.protocol
    this._chainID = options.chainID
    this._createdAt = Date.now()
    this._updatedAt = this._createdAt
    this._isDefault = options.isDefault || false
    this._isPreferred = options.isPreferred || false
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

  get protocol(): SupportedProtocols {
    return this._protocol
  }

  get isDefault(): boolean {
    return this._isDefault
  }

  get isPreferred(): boolean {
    return this._isPreferred
  }

  get chainID(): string {
    return this._chainID
  }

  serialize(): SerializedNetwork {
    return {
      id: this._id,
      name: this._name,
      rpcUrl: this._rpcUrl,
      isDefault: this._isDefault,
      isPreferred: this._isPreferred,
      protocol: this._protocol,
      chainID: this._chainID,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }

  static deserialize<T extends SupportedProtocols>(serializedNetwork: SerializedNetwork): Network<T> {
    const options: INetworkOptions<T> = {
      name: serializedNetwork.name,
      rpcUrl: serializedNetwork.rpcUrl,
      protocol: serializedNetwork.protocol,
      chainID: serializedNetwork.chainID as ChainID<T>,
      isDefault: serializedNetwork.isDefault,
      isPreferred: serializedNetwork.isPreferred,
    }

    const deserializedNetwork = new Network(options, serializedNetwork.id)

    deserializedNetwork._createdAt = serializedNetwork.createdAt
    deserializedNetwork._updatedAt = serializedNetwork.updatedAt

    return deserializedNetwork
  }
}
