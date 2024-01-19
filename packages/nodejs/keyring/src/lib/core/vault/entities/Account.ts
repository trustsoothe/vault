import {v4, validate} from "uuid";
import {AccountReference, SupportedProtocols} from "../../common/values";
import IEntity from "../../common/IEntity";
import {ArgumentError} from "../../../errors";

export interface SerializedAccount extends IEntity {
  id: string
  name: string
  publicKey: string
  privateKey: string
  address: string
  protocol: SupportedProtocols
  isSecure: boolean;
  createdAt: number
  updatedAt: number
}

export interface AccountOptions {
  name?: string
  publicKey: string
  privateKey: string
  address: string
  protocol: SupportedProtocols
  secure: boolean
}

export interface AccountUpdateOptions {
  id: string
  name: string
}

export class Account implements IEntity {
  private readonly _id: string
  private _name: string
  private readonly _publicKey: string
  private readonly _privateKey: string
  private readonly _address: string
  private readonly _protocol: SupportedProtocols
  private readonly _secure: boolean;
  private _createdAt: number
  private _updatedAt: number

  constructor(options: AccountOptions, id?: string) {
    if (id && validate(id) === false) {
      throw new ArgumentError(`"id = ${id}"`)
    }

    if (!options.publicKey) {
      throw new ArgumentError('Public key cannot be null or empty')
    }

    if (!options.privateKey) {
      throw new ArgumentError('Private key cannot be null or empty')
    }

    if  (!options.address) {
      throw new ArgumentError('Address cannot be null or empty')
    }

    if (!options.protocol)  {
      throw new ArgumentError('Protocol cannot be null or empty')
    }

    this._id = id || v4()
    this._name = options.name || ''
    this._publicKey = options.publicKey
    this._privateKey = options.privateKey
    this._address = options.address
    this._protocol = options.protocol
    this._secure = options.secure
    this._createdAt = Date.now()
    this._updatedAt = Date.now()
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
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

  get createdAt(): number {
    return this._createdAt
  }

  get updatedAt(): number {
    return this._updatedAt
  }

  get protocol(): SupportedProtocols {
    return this._protocol
  }

  get isSecure(): boolean {
    return this._secure;
  }

  updateName(name: string): void {
    this._name = name
    this._updatedAt = Date.now()
  }

  serialize(): SerializedAccount {
    return {
      id: this.id,
      name: this.name,
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      address: this.address,
      protocol: this.protocol,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isSecure: this.isSecure,
    }
  }

  static deserialize(serializedAccount: SerializedAccount): Account {
    const options: AccountOptions = {
      name: serializedAccount.name,
      publicKey: serializedAccount.publicKey,
      privateKey: serializedAccount.privateKey,
      address: serializedAccount.address,
      protocol: serializedAccount.protocol,
      secure: serializedAccount.isSecure,
    }

    const deserializedAccount =  new Account(options, serializedAccount.id)

    deserializedAccount._createdAt = serializedAccount.createdAt
    deserializedAccount._updatedAt = serializedAccount.updatedAt

    return deserializedAccount
  }

  asAccountReference(): AccountReference {
    return new AccountReference(this.id, this.name, this.address, this.protocol)
  }
}
