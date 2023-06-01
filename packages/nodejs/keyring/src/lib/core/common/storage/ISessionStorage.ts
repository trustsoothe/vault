import {SerializedSession} from "../../session";

export default interface ISessionStore {
  getById(id: string): Promise<SerializedSession | null>
  list(): Promise<ReadonlyArray<SerializedSession>>
  save(session: SerializedSession): Promise<void>
  remove(id: string): Promise<void>
  removeAll(): Promise<void>
}
