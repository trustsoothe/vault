import {SerializedNetwork} from "@poktscan/keyring";
import {GenericFileSystemStorage} from "./GenericFileSystemStorage";

export class FileSystemNetworkStorage extends GenericFileSystemStorage<SerializedNetwork> { }
