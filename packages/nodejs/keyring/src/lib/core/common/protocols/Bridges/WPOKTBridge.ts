import {PocketNetworkProtocolTransaction} from "../PocketNetwork/PocketNetworkProtocolTransaction";
import {EthereumNetworkProtocolTransaction} from "../EthereumNetwork/EthereumNetworkProtocolTransaction";
import {SupportedProtocols} from "../../values";
import {PocketNetworkTransactionTypes} from "../PocketNetwork/PocketNetworkTransactionTypes";
import {EthereumNetworkTransactionTypes} from "../EthereumNetwork/EthereumNetworkTransactionTypes";
import { Contract } from "web3-eth-contract";
import mintControllerABI from '../EthereumNetwork/contracts/WPOKTMintController';
import WPoktABI from '../EthereumNetwork/contracts/WPOKT';

export interface WPOKTBridgeOptions {
  from: string;
  ethereumAddress: string;
  vaultAddress: string;
  chainID: string;
  amount: string;
}

export interface WPOKMintOptions {
  contractAddress: string;
  mintInfo: {
    recipient: string;
    amount: string;
    nonce: string;
  };
  signatures: string[];
}

export interface WPOKBurnOptions {
  contractAddress: string;
  from: string;
  to: string;
  amount: string;
}

export class WPOKTBridge {
  createBridgeTransaction(options: WPOKTBridgeOptions): Omit<PocketNetworkProtocolTransaction, 'privateKey' | 'fee'> {
    return {
      protocol: SupportedProtocols.Pocket,
      transactionType: PocketNetworkTransactionTypes.Send,
      from: options.from,
      to: options.vaultAddress,
      amount: options.amount,
      memo: JSON.stringify({
        address: options.ethereumAddress,
        chain_id: options.chainID,
      })
    }
  }

  createMintTransaction(options: WPOKMintOptions): Pick<EthereumNetworkProtocolTransaction, 'protocol' | 'transactionType' | 'data'> {
    const contract = new Contract(mintControllerABI, options.contractAddress);

    const data = contract.methods.mintWrappedPocket(options.mintInfo, options.signatures).encodeABI();

    return {
      protocol: SupportedProtocols.Ethereum,
      transactionType: EthereumNetworkTransactionTypes.Transfer,
      data,
    }
  }

  createBurnTransaction(options: WPOKBurnOptions): Pick<EthereumNetworkProtocolTransaction, 'protocol' | 'transactionType' | 'data' | 'from'> {
    const contract = new Contract(WPoktABI, options.contractAddress);

    const data = contract.methods.burnAndBridge(options.amount, options.to).encodeABI();

    return {
      protocol: SupportedProtocols.Ethereum,
      transactionType: EthereumNetworkTransactionTypes.Transfer,
      from: options.from,
      data,
    }
  }
}
