export default interface IStorage<T> {
  getById(id: string): Promise<T | null>
  list(): Promise<ReadonlyArray<T>>
  save(entity: T): Promise<void>
  remove(id: string): Promise<void>
  removeAll(): Promise<void>
}
