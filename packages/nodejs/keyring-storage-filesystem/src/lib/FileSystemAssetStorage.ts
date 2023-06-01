import {SerializedAsset} from "@poktscan/keyring";
import {GenericFileSystemStorage} from "./GenericFileSystemStorage";

export class FileSystemAssetStorage extends GenericFileSystemStorage<SerializedAsset> { }
