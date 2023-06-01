import {v4, validate} from "uuid";
import {AccountReference} from "../../common/values/AccountReference";
import IEntity from "../../common/IEntity";
import {Asset, SerializedAsset} from "../../asset";

export interface SerializedAccount extends IEntity {
  id: string
  publicKey: string
  privateKey: string
  address: string
  asset: SerializedAsset
  createdAt: number
  updatedAt: number
}

export interface AccountOptions {
  publicKey: string
  privateKey: string
  address: string
  asset: Asset
}

export class Account implements IEntity {
  private readonly _id: string
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

  serialize(): SerializedAccount {
    return {
      id: this._id,
      publicKey: this._publicKey,
      privateKey: this._privateKey,
      address: this._address,
      asset: this._asset.serialize(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }

  static deserialize(serializedAccount: SerializedAccount): Account {
    const options: AccountOptions = {
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
    return new AccountReference(this._id, this._address, this._asset.network.protocol)
  }
}
