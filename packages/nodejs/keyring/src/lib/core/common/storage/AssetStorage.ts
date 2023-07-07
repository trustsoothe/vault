import {SerializedAsset} from "../../asset";
import {SupportedProtocols} from "../values";
import IStorage from "./IStorage";

export abstract class AssetStorage implements IStorage<SerializedAsset> {
  protected readonly _defaults: ReadonlyArray<SerializedAsset> = [
    {
      id: '942200cf-7a26-4e21-b7ad-e6b0b7255889',
      name: 'Pocket',
      symbol: 'POKT',
      isDefault: true,
      protocol: {
        name: SupportedProtocols.Pocket,
        chainID: 'testnet',
      },
      createdAt: 1688595970086,
      updatedAt: 1688595970086,
    },
  ];

  abstract getById(id: string): Promise<SerializedAsset | null>
  abstract list(): Promise<ReadonlyArray<SerializedAsset>>

  abstract save(asset: SerializedAsset): Promise<void>
  abstract remove(id: string): Promise<void>
  abstract removeAll(): Promise<void>
}
