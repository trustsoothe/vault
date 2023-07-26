import {v4, validate} from "uuid";
import IEntity from "../common/IEntity";
import {Protocol} from "../common/Protocol";
import {Status} from "./values/Status";

export interface SerializedNetwork extends IEntity {
  id: string
  name: string
  rpcUrl: string
  isDefault: boolean
  protocol: Protocol
  createdAt: number
  updatedAt: number
  status: {
    fee: boolean
    feeStatusLastUpdated?: number
    balance: boolean
    balanceStatusLastUpdated?: number
    sendTransaction: boolean
    sendTransactionStatusLastUpdated?: number
  }
}

export interface NetworkOptions {
  name: string
  rpcUrl: string
  protocol: Protocol
  isDefault?: boolean
}

export class Network implements IEntity {
  private readonly _id: string
  private readonly _name: string
  private readonly _rpcUrl: string
  private readonly _protocol: Protocol
  private readonly _isDefault: boolean
  private _status: Status
  private _createdAt: number
  private _updatedAt: number

  constructor(options: NetworkOptions, id?: string) {
    if (id && validate(id) === false) {
      throw new Error('Invalid session id: ' + id)
    }

    this._id = id || v4()
    this._name = options.name
    this._rpcUrl = options.rpcUrl
    this._protocol = options.protocol
    this._createdAt = Date.now()
    this._updatedAt = this._createdAt
    this._isDefault = options.isDefault || false
    this._status = new Status()
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

  get protocol(): Protocol {
    return Object.assign({}, this._protocol)
  }

  get isDefault(): boolean {
    return this._isDefault
  }

  get status(): Status {
    return this._status
  }

  serialize(): SerializedNetwork {
    return {
      id: this._id,
      name: this._name,
      rpcUrl: this._rpcUrl,
      isDefault: this._isDefault,
      protocol: this._protocol,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      status: {
        fee: this._status.canProvideFee,
        feeStatusLastUpdated: this._status.feeStatusLastUpdated,
        balance: this._status.canProvideBalance,
        balanceStatusLastUpdated: this._status.balanceStatusLastUpdated,
        sendTransaction: this._status.canSendTransaction,
        sendTransactionStatusLastUpdated: this._status.sendTransactionStatusLastUpdated
      }
    }
  }

  static deserialize(serializedNetwork: SerializedNetwork): Network {
    const options: NetworkOptions = {
      name: serializedNetwork.name,
      rpcUrl: serializedNetwork.rpcUrl,
      protocol: serializedNetwork.protocol,
      isDefault: serializedNetwork.isDefault
    }

    const deserializedNetwork = new Network(options, serializedNetwork.id)

    deserializedNetwork._createdAt = serializedNetwork.createdAt
    deserializedNetwork._updatedAt = serializedNetwork.updatedAt
    deserializedNetwork._status = new Status(serializedNetwork)

    return deserializedNetwork
  }
}
