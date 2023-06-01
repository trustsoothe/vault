import {SupportedProtocols} from "../../common/values";
import {v4, validate} from "uuid";
import {AccountReference} from "../../common/values/AccountReference";
import IEntity from "../../common/IEntity";

export interface SerializedAccount extends IEntity {
  id: string
  publicKey: string
  privateKey: string
  address: string
  protocol: SupportedProtocols
  createdAt: number
  updatedAt: number
}

export class Account implements IEntity {
  private readonly _id: string
  private readonly _publicKey: string
  private readonly _privateKey: string
  private readonly _address: string
  private readonly _protocol: SupportedProtocols
  private _createdAt: number
  private _updatedAt: number

  constructor(publicKey: string, privateKey: string, address: string, protocol: SupportedProtocols, id?: string, createdAt?: number, updatedAt?: number) {
    if (id && validate(id) === false) {
      throw new Error('Invalid account id: ' + id)
    }

    if (!publicKey) {
      throw new Error('Public key cannot be null or empty')
    }

    if (!privateKey) {
      throw new Error('Private key cannot be null or empty')
    }

    if  (!address) {
      throw new Error('Address cannot be null or empty')
    }

    if (!protocol) {
      throw new Error('Protocol cannot be null or empty')
    }

    this._id = id || v4()
    this._publicKey = publicKey
    this._privateKey = privateKey
    this._address = address
    this._protocol = protocol
    this._createdAt = Date.now()
    this._updatedAt = Date.now()
  }

  static deserialize(serializedAccount: SerializedAccount): Account {
    return new Account(
      serializedAccount.publicKey,
      serializedAccount.privateKey,
      serializedAccount.address,
      serializedAccount.protocol,
      serializedAccount.id,
      serializedAccount.createdAt,
      serializedAccount.updatedAt
    )
  }

  get id(): string {
    return this._id
  }

  get publicKey(): string {
    return this._publicKey
  }

  get privateKey(): string {
    return this._privateKey
  }

  get address(): string {
    return this._address
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

  serialize(): SerializedAccount {
    return {
      id: this._id,
      publicKey: this._publicKey,
      privateKey: this._privateKey,
      address: this._address,
      protocol: this._protocol,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  asAccountReference(): AccountReference {
    return new AccountReference(this._id, this._address, this._protocol)
  }
}
