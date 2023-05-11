import EncryptedVault from "../values/EncryptedVault";
export default interface IVaultStore {
    get(): Promise<EncryptedVault | null>;
    save(vault: EncryptedVault): Promise<void>;
}
