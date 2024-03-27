import type { SerializedNetwork } from '@poktscan/vault'
import { NetworkStorage } from '@poktscan/vault'
import { GenericExtensionStorage } from './GenericExtensionStorage'

export class ExtensionNetworkStorage extends NetworkStorage {
  private readonly networkStorage: GenericExtensionStorage<SerializedNetwork> = new GenericExtensionStorage<SerializedNetwork>('networks_set')

  getById(id: string): Promise<SerializedNetwork | null>
  getById(id: string): Promise<SerializedNetwork | null>
  getById(id: string): Promise<SerializedNetwork | null> {
    return this.networkStorage.getById(id);
  }

  list(): Promise<ReadonlyArray<SerializedNetwork>>;
  list(): Promise<ReadonlyArray<SerializedNetwork>>;
  async list(): Promise<ReadonlyArray<SerializedNetwork>> {
    const result = await this.networkStorage.list()
    return [
      ...this._defaults,
      ...result
    ];
  }

  remove(id: string): Promise<void> {
    return this.networkStorage.removeAll()
  }

  removeAll(): Promise<void> {
    return this.networkStorage.removeAll()
  }

  save(entity: SerializedNetwork): Promise<void>
  save(entity: SerializedNetwork): Promise<void>
  save(entity: SerializedNetwork): Promise<void> {
    return this.networkStorage.save(entity)
  }

}
