import { SerializedSession } from '@soothe/vault'
import { GenericFileSystemStorage } from './GenericFileSystemStorage'

export class FileSystemSessionStorage extends GenericFileSystemStorage<SerializedSession> {
}
