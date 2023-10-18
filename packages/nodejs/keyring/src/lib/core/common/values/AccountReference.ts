import { Asset, SerializedAsset } from "../../asset";

export interface SerializedAccountReference {
  id: string;
  name: string;
  address: string;
  asset: SerializedAsset;
}

export class AccountReference {
  private readonly _id: string = "";
  private readonly _name: string = "";
  private readonly _address: string = "";
  private readonly _asset: Asset;

  constructor(id: string, name: string, address: string, asset: Asset) {
    this._id = id;
    this._name = name;
    this._address = address;
    this._asset = asset;
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

  get asset(): Asset {
    return this._asset;
  }

  serialize(): SerializedAccountReference {
    return {
      id: this._id,
      name: this._name,
      address: this._address,
      asset: this._asset,
    };
  }

  static deserialize(data: SerializedAccountReference): AccountReference {
    return new AccountReference(
      data.id,
      data.name,
      data.address,
      Asset.deserialize(data.asset)
    );
  }
}
