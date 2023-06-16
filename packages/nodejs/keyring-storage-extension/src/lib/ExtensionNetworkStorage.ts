import type { SerializedNetwork } from "@poktscan/keyring";
import { GenericExtensionStorage } from "./GenericExtensionStorage";

export class ExtensionNetworkStorage extends GenericExtensionStorage<SerializedNetwork> {
  constructor() {
    super("networks_set");
  }
}
