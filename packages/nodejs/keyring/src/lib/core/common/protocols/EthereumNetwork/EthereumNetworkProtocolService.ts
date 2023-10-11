import {
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  IProtocolService,
  ITransferFundsResult,
  TransferFundsOptions,
} from "../IProtocolService";
import {EthereumNetworkProtocol} from "./EthereumNetworkProtocol";
import {Account} from "../../../vault";
import {AccountReference} from "../../values";
import {Network} from "../../../network";
import Eth from 'web3-eth'
import {
  create,
  privateKeyToPublicKey,
  privateKeyToAccount,
  privateKeyToAddress,
  parseAndValidatePrivateKey
} from 'web3-eth-accounts';
import {ArgumentError, NetworkRequestError} from "../../../../errors";
import {IEncryptionService} from "../../encryption/IEncryptionService";

export class EthereumNetworkProtocolService implements IProtocolService<EthereumNetworkProtocol> {
  constructor(private encryptionService: IEncryptionService) {}

  async createAccount(options: CreateAccountOptions): Promise<Account> {
    if (!options.asset) {
      throw new ArgumentError('options.asset')
    }

    if (!options.passphrase && !options.skipEncryption) {
      throw new ArgumentError('options.passphrase')
    }

    const account = create()

    let privateKey = account.privateKey

    if (options.passphrase) {
      privateKey = await this.encryptionService.encrypt(options.passphrase, privateKey)
    }

    return new Account({
      asset: options.asset,
      name: options.name || '',
      address: account.address,
      publicKey: privateKeyToPublicKey(account.privateKey, false),
      privateKey,
    })
  }

  async createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account> {
    if (!options.asset) {
      throw new ArgumentError('options.asset');
    }

    if (!options.passphrase && !options.skipEncryption) {
      throw new ArgumentError('options.passphrase');
    }

    if (!options.privateKey) {
      throw new ArgumentError('options.privateKey');
    }

    const rawPrivateKey = this.parsePrivateKey(options.privateKey)

    const account = privateKeyToAccount(rawPrivateKey)

    let privateKey = rawPrivateKey

    if (options.passphrase) {
      privateKey = await this.encryptionService.encrypt(options.passphrase, privateKey)
    }

    return new Account({
      asset: options.asset,
      name: options.name || '',
      address: account.address,
      publicKey: privateKeyToPublicKey(account.privateKey, false),
      privateKey,
    })
  }

  async getAddressFromPrivateKey(privateKey: string): Promise<string> {
    return privateKeyToAddress(this.parsePrivateKey(privateKey))
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

  async getFee(network: Network): Promise<number> {
    return Promise.resolve(0);
  }

  isValidPrivateKey(privateKey: string): boolean {
    try {
      this.parsePrivateKey(privateKey)
      return true;
    } catch (e) {
      return false;
    }
  }

  async transferFunds(network: Network, transferOptions: TransferFundsOptions<EthereumNetworkProtocol>): Promise<ITransferFundsResult<EthereumNetworkProtocol>> {
    throw new Error('Not Implemented')
  }

  async updateBalanceStatus(network: Network): Promise<Network> {
    throw new Error('Not Implemented')
  }

  async updateFeeStatus(network: Network): Promise<Network> {
    throw new Error('Not Implemented')
  }

  async updateNetworkStatus(network: Network): Promise<Network> {
    throw new Error('Not Implemented')
  }

  async updateSendTransactionStatus(network: Network): Promise<Network> {
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

  private parsePrivateKey(privateKey: string) {
    const rawPrivateKey = privateKey.startsWith('0x')
      ? privateKey
      : `0x${privateKey}`;

    return `0x${Buffer.from(parseAndValidatePrivateKey(rawPrivateKey)).toString('hex')}`;
  }
}
