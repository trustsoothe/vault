import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface PocketNetworkFee extends IAbstractProtocolFee<SupportedProtocols.Pocket> {
  value: number;
}
