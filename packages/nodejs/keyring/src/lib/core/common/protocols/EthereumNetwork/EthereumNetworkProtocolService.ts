import {
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  IProtocolService, ITransferFundsResult,
  TransferFundsOptions
} from "../IProtocolService";
import {EthereumNetworkProtocol} from "./EthereumNetworkProtocol";
import {Account} from "../../../vault";
import {AccountReference} from "../../values";
import {Network} from "../../../network";
import Eth from 'web3-eth'
import {ArgumentError, NetworkRequestError} from "../../../../errors";

export class EthereumNetworkProtocolService implements IProtocolService<EthereumNetworkProtocol> {

  createAccount(options: CreateAccountOptions): Promise<Account> {
    throw new Error('Not Implemented')
  }

  createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account> {
    throw new Error('Not Implemented')
  }

  getAddressFromPrivateKey(privateKey: string): Promise<string> {
    return Promise.resolve("");
  }

  async getBalance(network: Network, account: AccountReference): Promise<number> {
    this.validateNetwork(network)

    const ethClient = this.getEthClient(network)

    try {
      const balanceAsBigInt = await ethClient.getBalance(account.address)
      return Number(balanceAsBigInt.toString())
    } catch (e) {
      throw new NetworkRequestError('Failed to fetch balance');
    }
  }

  getFee(network: Network): Promise<number> {
    return Promise.resolve(0);
  }

  isValidPrivateKey(privateKey: string): boolean {
    return false;
  }

  transferFunds(network: Network, transferOptions: TransferFundsOptions<EthereumNetworkProtocol>): Promise<ITransferFundsResult<EthereumNetworkProtocol>> {
    throw new Error('Not Implemented')
  }

  updateBalanceStatus(network: Network): Promise<Network> {
    throw new Error('Not Implemented')
  }

  updateFeeStatus(network: Network): Promise<Network> {
    throw new Error('Not Implemented')
  }

  updateNetworkStatus(network: Network): Promise<Network> {
    throw new Error('Not Implemented')
  }

  updateSendTransactionStatus(network: Network): Promise<Network> {
    throw new Error('Not Implemented')
  }

  private getEthClient(network: Network): Eth {
    return new Eth(network.rpcUrl)
  }

  private validateNetwork(network: Network) {
    if (!network || !(network instanceof Network)) {
      throw new ArgumentError('network');
    }
  }
}
