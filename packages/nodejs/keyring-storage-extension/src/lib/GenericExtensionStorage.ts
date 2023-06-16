import type { IEntity, IStorage } from "@poktscan/keyring";
import * as browser from "webextension-polyfill";

export class GenericExtensionStorage<T extends IEntity> implements IStorage<T> {
  constructor(private readonly setPath: string) {}

  async getById(id: string): Promise<T | null> {
    const result = await browser.storage.local.get({ [this.setPath]: [] });
    const entities: T[] = result[this.setPath];
    const entity = entities.find((s: T) => s.id === id);
    return entity || null;
  }

  async save(entity: T): Promise<void> {
    const result = await browser.storage.local.get({ [this.setPath]: [] });
    const entities: T[] = result[this.setPath];
    const existingEntityIndex = entities.findIndex(
      (s: T) => s.id === entity.id
    );
    if (existingEntityIndex >= 0) {
      entities[existingEntityIndex] = entity;
    } else {
      entities.push(entity);
    }
    await browser.storage.local.set({ [this.setPath]: entities });
  }

  async remove(id: string): Promise<void> {
    const result = await browser.storage.local.get({ [this.setPath]: [] });
    const entities: T[] = result[this.setPath];
    const entityIndex = entities.findIndex((s: T) => s.id === id);
    if (entityIndex >= 0) {
      entities.splice(entityIndex, 1);
      await browser.storage.local.set({ [this.setPath]: entities });
    }
  }

  async removeAll(): Promise<void> {
    await browser.storage.local.set({ [this.setPath]: [] });
  }

  async list(): Promise<ReadonlyArray<T>> {
    const result = await browser.storage.local.get({ [this.setPath]: [] });
    return result[this.setPath];
  }
}
