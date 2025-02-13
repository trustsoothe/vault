import IStorage from './IStorage'
import { SerializedNetwork } from '../../network'
import { SupportedProtocols } from '../values'

export abstract class NetworkStorage implements IStorage<SerializedNetwork> {
  abstract getById(id: string): Promise<SerializedNetwork | null>;

  abstract remove(id: string): Promise<void>;

  abstract removeAll(): Promise<void>;

  abstract save(entity: SerializedNetwork): Promise<void>;

  abstract list(): Promise<ReadonlyArray<SerializedNetwork>>;
}
