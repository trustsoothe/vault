import {SerializedEncryptedVault} from "../values";

export default interface IVaultStore {
  get(): Promise<SerializedEncryptedVault | null>
  save(vault: SerializedEncryptedVault): Promise<void>
}
