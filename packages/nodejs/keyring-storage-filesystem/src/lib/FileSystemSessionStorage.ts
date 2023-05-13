import * as fs from "fs";
import {ISessionStore, SerializedSession} from "@poktscan/keyring";

export class FileSystemSessionStorage implements ISessionStore {
  constructor(private readonly sessionFilePath: string) {
    if (!fs.existsSync(this.sessionFilePath)) {
      fs.writeFileSync(this.sessionFilePath, JSON.stringify([]), 'utf8');
    }
  }

  async getById(id: string): Promise<SerializedSession | null> {
    const sessionsFileContent = await fs.promises.readFile(this.sessionFilePath, 'utf8')
    const sessions = JSON.parse(sessionsFileContent)
    const session = sessions.find((s: SerializedSession) => s.id === id)
    return session || null
  }

  async save(session: SerializedSession): Promise<void> {
    const sessions = JSON.parse(fs.readFileSync(this.sessionFilePath, 'utf8'))
    const existingSessionIndex = sessions.findIndex((s: SerializedSession) => s.id === session.id)
    if (existingSessionIndex >= 0) {
      sessions[existingSessionIndex] = session
    } else {
      sessions.push(session)
    }
    await fs.promises.writeFile(this.sessionFilePath, JSON.stringify(sessions), 'utf8')
  }

  async remove(id: string): Promise<void> {
    const sessionsFileContent = await fs.promises.readFile(this.sessionFilePath, 'utf8')
    const sessions = JSON.parse(sessionsFileContent)
    const sessionIndex = sessions.findIndex((s: SerializedSession) => s.id === id)
    if (sessionIndex >= 0) {
      sessions.splice(sessionIndex, 1)
      await fs.promises.writeFile(this.sessionFilePath, JSON.stringify(sessions), 'utf8')
    }
  }

  async removeAll(): Promise<void> {
    await fs.promises.writeFile(this.sessionFilePath, JSON.stringify([]), 'utf8')
  }
}
