import {SerializedNetwork} from "../../network";

export default interface INetworkStorage {
  getById(id: string): Promise<SerializedNetwork | null>
  list(): Promise<ReadonlyArray<SerializedNetwork>>
  save(network: SerializedNetwork): Promise<void>
  remove(id: string): Promise<void>
  removeAll(): Promise<void>
}
