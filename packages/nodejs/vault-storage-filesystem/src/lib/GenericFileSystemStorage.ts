import * as fs from "fs";
import {IEntity, IStorage} from "@soothe/vault";

export class GenericFileSystemStorage<T extends IEntity> implements IStorage<T> {
  constructor(private readonly filePath: string) {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]), 'utf8');
    }
  }

  async getById(id: string): Promise<T | null> {
    const fileContent = await fs.promises.readFile(this.filePath, 'utf8')
    const entities = JSON.parse(fileContent)
    const entity = entities.find((s: T) => s.id === id)
    return entity || null
  }

  async save(entity: T): Promise<void> {
    const entities = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
    const existingEntityIndex = entities.findIndex((s: T) => s.id === entity.id)
    if (existingEntityIndex >= 0) {
      entities[existingEntityIndex] = entity
    } else {
      entities.push(entity)
    }
    await fs.promises.writeFile(this.filePath, JSON.stringify(entities), 'utf8')
  }

  async remove(id: string): Promise<void> {
    const fileContent = await fs.promises.readFile(this.filePath, 'utf8')
    const entities = JSON.parse(fileContent)
    const entityIndex = entities.findIndex((s: T) => s.id === id)
    if (entityIndex >= 0) {
      entities.splice(entityIndex, 1)
      await fs.promises.writeFile(this.filePath, JSON.stringify(entities), 'utf8')
    }
  }

  async removeAll(): Promise<void> {
    await fs.promises.writeFile(this.filePath, JSON.stringify([]), 'utf8')
  }

  list(): Promise<ReadonlyArray<T>> {
    return Promise.resolve(JSON.parse(fs.readFileSync(this.filePath, 'utf8')))
  }
}
