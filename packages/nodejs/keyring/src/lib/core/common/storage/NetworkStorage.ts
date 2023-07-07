import IStorage from "./IStorage";
import {SerializedNetwork} from "../../network";
import {SupportedProtocols} from "../values";

export abstract class NetworkStorage implements IStorage<SerializedNetwork> {
  protected readonly _defaults: ReadonlyArray<SerializedNetwork> = [
    {
      id: '942200cf-7a26-4e21-b7ad-e6b0b7255889',
      name: 'Pocket - Testnet',
      isDefault: true,
      rpcUrl: 'https://node1.testnet.pokt.network',
      protocol: {
        name: SupportedProtocols.Pocket,
        chainID: 'testnet',
      },
      createdAt: 1688595970086,
      updatedAt: 1688595970086,
    }
  ];
  abstract getById(id: string): Promise<SerializedNetwork | null>;

  abstract remove(id: string): Promise<void>;

  abstract removeAll(): Promise<void>;

  abstract save(entity: SerializedNetwork): Promise<void>;

  abstract list(): Promise<ReadonlyArray<SerializedNetwork>>;
}
