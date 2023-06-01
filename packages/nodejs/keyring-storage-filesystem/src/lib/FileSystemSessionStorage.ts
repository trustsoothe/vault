import {SerializedSession} from "@poktscan/keyring";
import {GenericFileSystemStorage} from "./GenericFileSystemStorage";

export class FileSystemSessionStorage extends GenericFileSystemStorage<SerializedSession> { }
