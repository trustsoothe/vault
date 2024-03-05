import type { SerializedSession } from "@soothe/vault";
import { GenericExtensionStorage } from "./GenericExtensionStorage";

export class ExtensionSessionStorage extends GenericExtensionStorage<SerializedSession> {
  constructor() {
    super("sessions_set");
  }
}
