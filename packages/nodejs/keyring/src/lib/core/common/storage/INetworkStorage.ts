import {SerializedNetwork} from "../../network";

export default interface INetworkStorage {
  getById(id: string): Promise<SerializedNetwork | null>
  save(session: SerializedNetwork): Promise<void>
  list(): Promise<SerializedNetwork[]>
  update(): Promise<void>
  remove(id: string): Promise<void>
}
