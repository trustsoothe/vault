import {SerializedNetwork} from "@poktscan/vault";
import {GenericFileSystemStorage} from "./GenericFileSystemStorage";

export class FileSystemNetworkStorage extends GenericFileSystemStorage<SerializedNetwork> { }
