import {IAbstractProtocolFee} from "../ProtocolFee";
import {SupportedProtocols} from "../../values";

export interface PocketNetworkShannonFee extends IAbstractProtocolFee<SupportedProtocols.PocketShannon> {
  value: number;
  denom: string;
}
