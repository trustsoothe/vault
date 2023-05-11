import {EncryptedVault, SerializedEncryptedVault} from "../values";

export default interface IVaultStore {
  get(): Promise<EncryptedVault | null>
  save(vault: SerializedEncryptedVault): Promise<void>
}
