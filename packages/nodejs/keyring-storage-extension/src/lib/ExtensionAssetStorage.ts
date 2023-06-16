import type { SerializedAsset } from "@poktscan/keyring";
import { GenericExtensionStorage } from "./GenericExtensionStorage";

export class ExtensionAssetStorage extends GenericExtensionStorage<SerializedAsset> {
  constructor() {
    super("assets_set");
  }
}
