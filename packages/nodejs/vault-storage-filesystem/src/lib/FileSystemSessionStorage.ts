import {SerializedSession} from "@poktscan/vault";
import {GenericFileSystemStorage} from "./GenericFileSystemStorage";

export class FileSystemSessionStorage extends GenericFileSystemStorage<SerializedSession> { }
