import {v4, validate} from 'uuid';
import {SupportedProtocols} from '../../common/values'
import IEntity from '../../common/IEntity'
import {ArgumentError} from '../../../errors'
import {AccountReference, AccountType} from '../'
import {isNil, isNumber} from "lodash";

export interface SerializedAccount extends IEntity {
  id: string
  name: string
  publicKey: string
  privateKey: string
  address: string
  protocol: SupportedProtocols
  isSecure: boolean
  accountType?: AccountType
  seedId?: string
  parentId?: string
  hdwIndex?: number
  hdwAccountIndex?: number
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
  accountType?: AccountType
  seedId?: string
  parentId?: string
  hdwIndex?: number
  hdwAccountIndex?: number
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
  private readonly _accountType: AccountType
  private readonly _seedId?: string
  private readonly _parentId?: string
  private readonly _hdwIndex?: number
  private readonly _hdwAccountIndex?: number
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

    if (options.accountType && options.accountType === AccountType.HDChild) {
     if (!options.parentId) {
        throw new ArgumentError('Parent ID cannot be null or empty when account type is HDChild')
     }

     if (isNil(options.hdwIndex) || (isNumber(options.hdwIndex) && options.hdwIndex < 0)) {
        throw new ArgumentError('HDW Index cannot be null or empty or less than 0 when account type is HDChild')
     }

      if (isNil(options.hdwAccountIndex) || (isNumber(options.hdwAccountIndex) && options.hdwAccountIndex  < 0)) {
        throw new ArgumentError('HDW Account Index cannot be null or empty or less than 0 when account type is HDChild')
      }
    }

    if (options.accountType && options.accountType === AccountType.HDSeed) {
        if (!options.seedId) {
            throw new ArgumentError('Seed ID cannot be null or empty when account type is HDSeed')
        }
    }

    this._id = id || v4()
    this._name = options.name || ''
    this._publicKey = options.publicKey
    this._privateKey = options.privateKey
    this._address = options.address
    this._protocol = options.protocol
    this._secure = options.secure
    this._accountType = options.accountType || AccountType.Individual
    this._seedId = options.seedId || undefined
    this._parentId = options.parentId || undefined
    this._hdwIndex = isNumber(options.hdwIndex) ? options.hdwIndex : undefined
    this._hdwAccountIndex = isNumber(options.hdwAccountIndex) ? options.hdwAccountIndex : undefined
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

  get accountType(): AccountType {
    return this._accountType || AccountType.Individual
  }

  get parentId(): string | undefined {
    return this._parentId
  }

  get hdwIndex(): number | undefined {
    return this._hdwIndex
  }

  get hdwAccountIndex(): number | undefined {
    return this._hdwAccountIndex
  }

  get seedId(): string | undefined {
    return this._seedId
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
      accountType: this.accountType,
      seedId: this.seedId,
      parentId: this.parentId,
      hdwIndex: this.hdwIndex,
      hdwAccountIndex: this.hdwAccountIndex,
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
      accountType: serializedAccount.accountType,
      seedId: serializedAccount.seedId,
      parentId: serializedAccount.parentId,
      hdwIndex: serializedAccount.hdwIndex,
      hdwAccountIndex: serializedAccount.hdwAccountIndex
    }

    const deserializedAccount =  new Account(options, serializedAccount.id)

    deserializedAccount._createdAt = serializedAccount.createdAt
    deserializedAccount._updatedAt = serializedAccount.updatedAt

    return deserializedAccount
  }

  asAccountReference(): AccountReference {
    return new AccountReference({
        id: this.id,
        name: this.name,
        address: this.address,
        protocol: this.protocol,
        accountType: this.accountType,
        parentId: this.parentId,
        hdwIndex: this.hdwIndex,
        seedId: this.seedId,
      });
  }
}
