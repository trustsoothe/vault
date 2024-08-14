import {SupportedProtocols} from "../../values";
import {IAbstractProtocolTransaction} from "../ProtocolTransaction";
import {PocketNetworkTransactionTypes} from "./PocketNetworkTransactionTypes";
import {DAOAction} from "./pocket-js";

export interface PocketNetworkProtocolTransaction extends IAbstractProtocolTransaction<SupportedProtocols.Pocket, typeof PocketNetworkTransactionTypes> {
    protocol: SupportedProtocols.Pocket;
    transactionType: PocketNetworkTransactionTypes;
    outputAddress?: string;
    fee?: number;
    memo?: string;
    appPubKey?: string;
    chains?: string[];
    appAddress?: string;
    serviceURL?: string;
    rewardDelegators?: { [key: string]: number };
    daoAction?: DAOAction;
    paramKey?: string;
    paramValue?: string;
    overrideGovParamsWhitelistValidation?: boolean;

}
