import {
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  IProtocolService,
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
import {INetwork} from "../INetwork";
import {IAsset} from "../IAsset";
import {NetworkStatus} from "../../values/NetworkStatus";
import {EthereumProtocolNetworkSchema} from "./schemas";

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

  async getBalance(
    account: AccountReference,
    network: INetwork,
    asset?: IAsset
  ): Promise<number> {
    this.validateNetwork(network)

    if (!account || !(account instanceof AccountReference)) {
      throw new ArgumentError('account');
    }

    if (!asset) {
      return await this.getNativeTokenBalance(network, account);
    }

    return 0;
  }

  async getFee(network: INetwork, options: IAbstractTransferFundsResult<SupportedProtocols.Ethereum>): Promise<ProtocolFee<SupportedProtocols.Ethereum>> {
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

  async transferFunds(network: INetwork): Promise<IAbstractTransferFundsResult<SupportedProtocols.Ethereum>> {
    throw new Error('Not Implemented')
  }

  async getNetworkBalanceStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    throw new Error('Not Implemented')
  }

  async getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    throw new Error('Not Implemented')
  }

  async getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    throw new Error('Not Implemented')
  }

  async getNetworkStatus(network: INetwork): Promise<NetworkStatus> {
    this.validateNetwork(network);
    throw new Error('Not Implemented')
  }

  private getEthClient(network: INetwork): Eth {
    return new Eth(network.rpcUrl)
  }

  private validateNetwork(network: INetwork) {
    try {
      EthereumProtocolNetworkSchema.parse(network);
    } catch {
      throw new ArgumentError('network');
    }
  }

  private parsePrivateKey(privateKey: string) {
    const rawPrivateKey = privateKey.startsWith('0x')
      ? privateKey
      : `0x${privateKey}`;

    return `0x${Buffer.from(parseAndValidatePrivateKey(rawPrivateKey)).toString('hex')}`;
  }

  private async getNativeTokenBalance(network: INetwork, account: AccountReference) {
    const ethClient = this.getEthClient(network)

    try {
      const balanceAsBigInt = await ethClient.getBalance(account.address)
      return Number(balanceAsBigInt.toString())
    } catch (e) {
      throw new NetworkRequestError('Failed to fetch balance');
    }
  }
}
