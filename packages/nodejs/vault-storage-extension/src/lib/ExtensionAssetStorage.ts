import { AssetStorage } from '@soothe/vault'
import type { IStorage, SerializedAsset } from '@soothe/vault'
import { GenericExtensionStorage } from './GenericExtensionStorage'

export class ExtensionAssetStorage extends AssetStorage {
  private readonly assetStorage: IStorage<SerializedAsset> = new GenericExtensionStorage<SerializedAsset>('assets_set')

  getById(id: string): Promise<SerializedAsset | null>
  getById(id: string): Promise<SerializedAsset | null>
  getById(id: string): Promise<SerializedAsset | null> {
    return this.assetStorage.getById(id)
  }

  remove(id: string): Promise<void> {
    return this.assetStorage.remove(id)
  }

  removeAll(): Promise<void> {
    return this.assetStorage.removeAll()
  }

  save(asset: SerializedAsset): Promise<void>
  save(entity: SerializedAsset): Promise<void>
  save(asset: SerializedAsset): Promise<void> {
    return this.assetStorage.save(asset)
  }

  async list(): Promise<ReadonlyArray<SerializedAsset>> {
    const result = await this.assetStorage.list()
    return [
      ...this._defaults,
      ...result,
    ]
  }
}
