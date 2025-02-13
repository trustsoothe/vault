import type { SerializedNetwork } from '@soothe/vault'
import { NetworkStorage } from '@soothe/vault'
import { GenericExtensionStorage } from './GenericExtensionStorage'

export class ExtensionNetworkStorage extends NetworkStorage {
  private readonly networkStorage: GenericExtensionStorage<SerializedNetwork> = new GenericExtensionStorage<SerializedNetwork>('networks_set')

  getById(id: string): Promise<SerializedNetwork | null>
  getById(id: string): Promise<SerializedNetwork | null>
  getById(id: string): Promise<SerializedNetwork | null> {
    return this.networkStorage.getById(id)
  }

  list(): Promise<ReadonlyArray<SerializedNetwork>>;
  list(): Promise<ReadonlyArray<SerializedNetwork>>;
  async list(): Promise<ReadonlyArray<SerializedNetwork>> {
    return await this.networkStorage.list()
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
