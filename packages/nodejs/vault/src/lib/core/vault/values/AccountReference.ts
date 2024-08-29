import { SupportedProtocols } from "../../common/values";
import { AccountType } from "./AccountType";
import { isNumber } from "lodash";

export interface SerializedAccountReference {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  protocol: SupportedProtocols;
  accountType: AccountType;
  parentId: string;
  hdwIndex?: number;
  seedId?: string;
}

export interface AccountReferenceOptions {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  protocol: SupportedProtocols;
  accountType?: AccountType;
  seedId?: string;
  parentId?: string;
  hdwIndex?: number;
}

export class AccountReference {
  private readonly _id: string = "";
  private readonly _name: string = "";
  private readonly _address: string = "";
  private readonly _publicKey: string;
  private readonly _protocol: SupportedProtocols;
  private readonly _accountType: AccountType;
  private readonly _seedId?: string;
  private readonly _parentId: string = "";
  private readonly _hdwIndex?: number;

  constructor(options: AccountReferenceOptions) {
    this._id = options.id;
    this._name = options.name;
    this._address = options.address;
    this._protocol = options.protocol;
    this._accountType = options.accountType || AccountType.Individual;
    this._seedId = options.seedId;
    this._parentId = options.parentId || "";
    this._hdwIndex = isNumber(options.hdwIndex) ? options.hdwIndex : undefined;
    this._publicKey = options.publicKey;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get address(): string {
    return this._address;
  }

  get protocol(): SupportedProtocols {
    return this._protocol;
  }

  get accountType(): AccountType {
    return this._accountType;
  }

  get parentId(): string {
    return this._parentId;
  }

  get hdwIndex(): number | undefined {
    return this._hdwIndex;
  }

  get seedId(): string | undefined {
    return this._seedId;
  }

  get publicKey(): string {
    return this._publicKey;
  }

  serialize(): SerializedAccountReference {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      protocol: this.protocol,
      accountType: this.accountType,
      parentId: this.parentId,
      hdwIndex: this.hdwIndex,
      seedId: this.seedId,
      publicKey: this.publicKey,
    };
  }

  static deserialize(data: SerializedAccountReference): AccountReference {
    return new AccountReference({
      id: data.id,
      name: data.name,
      address: data.address,
      protocol: data.protocol,
      accountType: data.accountType,
      parentId: data.parentId,
      hdwIndex: data.hdwIndex,
      seedId: data.seedId,
      publicKey: data.publicKey,
    });
  }
}
