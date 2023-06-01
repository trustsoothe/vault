import {SerializedAsset} from "../../asset";

export default interface IAssetStorage {
  getById(id: string): Promise<SerializedAsset | null>
  list(): Promise<ReadonlyArray<SerializedAsset>>
  save(asset: SerializedAsset): Promise<void>
  remove(id: string): Promise<void>
  removeAll(): Promise<void>
}
