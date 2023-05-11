import {IVaultStore, EncryptedVault, SerializedEncryptedVault} from "@poktscan/keyring"
import * as fs from "fs";

export class FileSystemVaultStorage implements IVaultStore {
    constructor(private readonly vaultFilePath: string) {}
    async get(): Promise<EncryptedVault | null> {
        try {
            if (fs.existsSync(this.vaultFilePath)) {
                const vaultJson = await fs.promises.readFile(this.vaultFilePath, 'utf8')
                if (vaultJson) {
                    const vault: SerializedEncryptedVault = JSON.parse(vaultJson)
                    return EncryptedVault.fromSerialized(vault)
                }
            }
        } catch (error) {
            return null
        }

        return null
    }
    async save(vault: SerializedEncryptedVault): Promise<void> {
        const vaultJson = JSON.stringify(vault)
        return fs.promises.writeFile(this.vaultFilePath, vaultJson, 'utf8')
    }
}
