import { Asset, SerializedAsset } from "../../asset";
import {SupportedProtocols} from "./SupportedProtocols";

export interface SerializedAccountReference {
  id: string;
  name: string;
  address: string;
  protocol: SupportedProtocols;
}

export class AccountReference {
  private readonly _id: string = "";
  private readonly _name: string = "";
  private readonly _address: string = "";
  private readonly _protocol: SupportedProtocols;

  constructor(id: string, name: string, address: string, protocol: SupportedProtocols) {
    this._id = id;
    this._name = name;
    this._address = address;
    this._protocol = protocol;
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

  serialize(): SerializedAccountReference {
    return {
      id: this._id,
      name: this._name,
      address: this._address,
      protocol: this._protocol,
    };
  }

  static deserialize(data: SerializedAccountReference): AccountReference {
    return new AccountReference(
      data.id,
      data.name,
      data.address,
      data.protocol,
    );
  }
}
