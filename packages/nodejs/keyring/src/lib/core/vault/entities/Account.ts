import {v4, validate} from "uuid";
import {AccountReference} from "../../common/values";
import IEntity from "../../common/IEntity";
import {Asset, SerializedAsset} from "../../asset";

export interface SerializedAccount extends IEntity {
  id: string
  name: string
  publicKey: string
  privateKey: string
  address: string
  asset: SerializedAsset
  createdAt: number
  updatedAt: number
}

export interface AccountOptions {
  name?: string
  publicKey: string
  privateKey: string
  address: string
  asset: Asset
}

export interface AccountUpdateOptions {
  id: string
  name?: string
}

export class Account implements IEntity {
  private readonly _id: string
  private _name: string
  private readonly _publicKey: string
  private readonly _privateKey: string
  private readonly _address: string
  private readonly _asset: Asset
  private _createdAt: number
  private _updatedAt: number

  constructor(options: AccountOptions, id?: string) {
    if (id && validate(id) === false) {
      throw new Error('Invalid account id: ' + id)
    }

    if (!options.publicKey) {
      throw new Error('Public key cannot be null or empty')
    }

    if (!options.privateKey) {
      throw new Error('Private key cannot be null or empty')
    }

    if  (!options.address) {
      throw new Error('Address cannot be null or empty')
    }

    if (!options.asset) {
      throw new Error('Asset information cannot be null or empty')
    }

    this._id = id || v4()
    this._name = options.name || ''
    this._publicKey = options.publicKey
    this._privateKey = options.privateKey
    this._address = options.address
    this._asset = options.asset
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

  get asset(): Readonly<Asset> {
    return this._asset
  }

  get createdAt(): number {
    return this._createdAt
  }

  get updatedAt(): number {
    return this._updatedAt
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
      asset: this.asset.serialize(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  static deserialize(serializedAccount: SerializedAccount): Account {
    const options: AccountOptions = {
      name: serializedAccount.name,
      publicKey: serializedAccount.publicKey,
      privateKey: serializedAccount.privateKey,
      address: serializedAccount.address,
      asset: Asset.deserialize(serializedAccount.asset)
    }

    const deserializedAccount =  new Account(options, serializedAccount.id)

    deserializedAccount._createdAt = serializedAccount.createdAt
    deserializedAccount._updatedAt = serializedAccount.updatedAt

    return deserializedAccount
  }

  asAccountReference(): AccountReference {
    return new AccountReference(this.id, this.name, this.address, this.asset.protocol)
  }
}
