import {SupportedProtocols} from "../../common/values";
import {AccountType} from "./AccountType";

export interface SerializedAccountReference {
  id: string;
  name: string;
  address: string;
  protocol: SupportedProtocols;
  accountType: AccountType;
  parentId: string;
}

export class AccountReference {
  private readonly _id: string = "";
  private readonly _name: string = "";
  private readonly _address: string = "";
  private readonly _protocol: SupportedProtocols;
  private readonly _accountType: AccountType;
  private readonly _parentId: string = "";

  constructor(id: string, name: string, address: string, protocol: SupportedProtocols, accountType?: AccountType, parentId?: string) {
    this._id = id;
    this._name = name;
    this._address = address;
    this._protocol = protocol;
    this._accountType = accountType || AccountType.Individual;
    this._parentId = parentId || "";
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

  serialize(): SerializedAccountReference {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      protocol: this.protocol,
      accountType: this.accountType,
      parentId: this.parentId,
    };
  }

  static deserialize(data: SerializedAccountReference): AccountReference {
    return new AccountReference(
      data.id,
      data.name,
      data.address,
      data.protocol,
      data.accountType,
    );
  }
}
