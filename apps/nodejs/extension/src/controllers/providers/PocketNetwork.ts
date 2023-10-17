import BaseProvider from "./base";
import { SupportedProtocols } from "@poktscan/keyring";

export default class PocketNetworkProvider extends BaseProvider {
  constructor() {
    super(SupportedProtocols.Pocket);
  }
}
