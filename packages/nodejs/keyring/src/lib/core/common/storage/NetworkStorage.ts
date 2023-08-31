import IStorage from "./IStorage";
import { SerializedNetwork } from "../../network";
import { SupportedProtocols } from "../values";

export abstract class NetworkStorage implements IStorage<SerializedNetwork> {
  protected readonly _defaults: ReadonlyArray<SerializedNetwork> = [
    {
      id: "942200cf-7a26-4e21-b7ad-e6b0b7255889",
      name: "Pocket - Testnet",
      isDefault: true,
      rpcUrl: "https://node1.testnet.pokt.network",
      protocol: {
        name: SupportedProtocols.Pocket,
        chainID: "testnet",
      },
      status: {
        fee: false,
        balance: false,
        sendTransaction: false,
      },
      createdAt: 1688595970086,
      updatedAt: 1688595970086,
    },
    {
      id: "2beccab6-5341-4393-8c8d-c7b5ef6b246b",
      name: "Pocket - Mainnet",
      isDefault: true,
      rpcUrl: "https://pocket.tango.admin.poktscan.cloud",
      protocol: {
        name: SupportedProtocols.Pocket,
        chainID: "mainnet",
      },
      status: {
        fee: false,
        balance: false,
        sendTransaction: false,
      },
      createdAt: 1693499936849,
      updatedAt: 1693499936849,
    },
  ];

  abstract getById(id: string): Promise<SerializedNetwork | null>;

  abstract remove(id: string): Promise<void>;

  abstract removeAll(): Promise<void>;

  abstract save(entity: SerializedNetwork): Promise<void>;

  abstract list(): Promise<ReadonlyArray<SerializedNetwork>>;
}
