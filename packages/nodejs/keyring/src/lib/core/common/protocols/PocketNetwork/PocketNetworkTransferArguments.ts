import {IProtocolTransferArguments} from "../IProtocolTransferArguments";
import {PocketNetworkProtocol} from "./PocketNetworkProtocol";
import {ChainID} from "../IProtocol";
import {SupportedProtocols} from "../../values";

export class PocketNetworkTransferArguments implements IProtocolTransferArguments<PocketNetworkProtocol> {
  protocol: PocketNetworkProtocol;

  constructor(chainID: ChainID<SupportedProtocols.Pocket>, public memo: string = '', public fee?: number) {
    this.protocol = new PocketNetworkProtocol(chainID);
  }
}
