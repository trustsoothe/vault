import {
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  IProtocolService,
  TransferFundsOptions,
} from "../IProtocolService";
import {Account} from "../../../vault";
import {AccountReference, SupportedProtocols} from "../../values";
import {Network as NetworkObject} from "../../../network";
import Eth from 'web3-eth'
import {
  create,
  privateKeyToPublicKey,
  privateKeyToAccount,
  privateKeyToAddress,
  parseAndValidatePrivateKey,
} from 'web3-eth-accounts';
import {ArgumentError, NetworkRequestError} from "../../../../errors";
import {IEncryptionService} from "../../encryption/IEncryptionService";
import {ProtocolFee} from "../ProtocolFee";
import {IAbstractTransferFundsResult} from "../ProtocolTransferFundsResult";

type Network = NetworkObject<SupportedProtocols.Ethereum>;

export class EthereumNetworkProtocolService implements IProtocolService<SupportedProtocols.Ethereum> {
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

    if (!account || !(account instanceof AccountReference)) {
      throw new ArgumentError('account');
    }

    if (account.asset.isNative) {
      return await this.getNativeTokenBalance(network, account);
    }

    return 0;
  }

  async getFee(network: Network): Promise<ProtocolFee<SupportedProtocols.Ethereum>> {
    return {
      protocol: SupportedProtocols.Ethereum,
      gasLimit: BigInt(21000),
      gasPrice: BigInt(1),
      suggestedLow: BigInt(1),
      suggestedMedium: BigInt(1),
      suggestedHigh: BigInt(1),
    }
  }

  isValidPrivateKey(privateKey: string): boolean {
    try {
      this.parsePrivateKey(privateKey)
      return true;
    } catch (e) {
      return false;
    }
  }

  async transferFunds(network: Network, transferOptions: TransferFundsOptions<SupportedProtocols.Ethereum>): Promise<IAbstractTransferFundsResult<SupportedProtocols.Ethereum>> {
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
    if (!network || !(network instanceof NetworkObject<SupportedProtocols.Ethereum>)) {
      throw new ArgumentError('network');
    }
  }

  private parsePrivateKey(privateKey: string) {
    const rawPrivateKey = privateKey.startsWith('0x')
      ? privateKey
      : `0x${privateKey}`;

    return `0x${Buffer.from(parseAndValidatePrivateKey(rawPrivateKey)).toString('hex')}`;
  }

  private async getNativeTokenBalance(network: Network, account: AccountReference) {
    const ethClient = this.getEthClient(network)

    try {
      const balanceAsBigInt = await ethClient.getBalance(account.address)
      return Number(balanceAsBigInt.toString())
    } catch (e) {
      throw new NetworkRequestError('Failed to fetch balance');
    }
  }
}
