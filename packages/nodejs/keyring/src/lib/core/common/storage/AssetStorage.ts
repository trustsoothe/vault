import { SerializedAsset } from "../../asset";
import { SupportedProtocols } from "../values";
import IStorage from "./IStorage";

export abstract class AssetStorage implements IStorage<SerializedAsset> {
  protected readonly _defaults: ReadonlyArray<SerializedAsset> = [
    {
      id: "942200cf-7a26-4e21-b7ad-e6b0b7255889",
      name: "Pocket",
      symbol: "POKT",
      isDefault: true,
      protocol: SupportedProtocols.Pocket,
      isNative: true,
      createdAt: 1688595970086,
      updatedAt: 1688595970086,
    },
    {
      id: "2beccab6-5341-4393-8c8d-c7b5ef6b246b",
      name: "Ethereum",
      symbol: "ETH",
      isDefault: true,
      protocol: SupportedProtocols.Ethereum,
      isNative: true,
      createdAt: 1693499936849,
      updatedAt: 1693499936849,
    },
  ];

  abstract getById(id: string): Promise<SerializedAsset | null>;

  abstract list(): Promise<ReadonlyArray<SerializedAsset>>;

  abstract save(asset: SerializedAsset): Promise<void>;

  abstract remove(id: string): Promise<void>;

  abstract removeAll(): Promise<void>;
}
