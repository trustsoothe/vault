import {
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  IProtocolService,
} from "../IProtocolService";
import {Account} from "../../../vault";
import {AccountReference, SupportedProtocols} from "../../values";
import Eth from 'web3-eth'
import {
  create,
  privateKeyToPublicKey,
  privateKeyToAccount,
  privateKeyToAddress,
  parseAndValidatePrivateKey,
} from 'web3-eth-accounts';
import {fromWei, toWei} from 'web3-utils';
import {ArgumentError, NetworkRequestError} from "../../../../errors";
import {IEncryptionService} from "../../encryption/IEncryptionService";
import {ProtocolFee} from "../ProtocolFee";
import {IAbstractTransferFundsResult} from "../ProtocolTransferFundsResult";
import {INetwork} from "../INetwork";
import {IAsset} from "../IAsset";
import {NetworkStatus} from "../../values/NetworkStatus";
import {EthereumProtocolFeeRequestSchema, EthereumProtocolNetworkSchema} from "./schemas";
import {EthereumNetworkFeeRequestOptions} from "./EthereumNetworkFeeRequestOptions";
import {SUGGESTED_GAS_FEES_URL} from "../../../../constants";

interface SuggestedFeeSpeed {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
}

interface SuggestedFees {
  low: SuggestedFeeSpeed;
  medium: SuggestedFeeSpeed;
  high: SuggestedFeeSpeed;
  estimatedBaseFee: string;
  networkCongestion: number;
  latestPriorityFeeRange: string[];
  historicalPriorityFeeRange: string[];
  historicalBaseFeeRange: string[];
  priorityFeeTrend: string;
  baseFeeTrend: string;
};

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

  async getFee(network: INetwork, options: EthereumNetworkFeeRequestOptions): Promise<ProtocolFee<SupportedProtocols.Ethereum>> {
    this.validateNetwork(network);
    this.validateFeeRequestOptions(options);

    const url = SUGGESTED_GAS_FEES_URL.replace(':chainid', network.chainID);

    const ethClient = this.getEthClient(network);

    let estimatedGas = 0;
    let suggestions: SuggestedFees;

    try {
      estimatedGas = Number(await ethClient.estimateGas(options)) * 1.5;
    } catch (e) {
      console.error(e);
      throw new NetworkRequestError('Failed while estimating gas');
    }

    try {
      const suggestionsResponse = await globalThis.fetch(url);
      suggestions = await suggestionsResponse.json();
    } catch (e) {
      console.log(e);
      throw new NetworkRequestError('Failed while fetching suggested fees');
    }

    const calculateAmountForSpeed = (baseFee: string, estimatedGas: number, speed: SuggestedFeeSpeed) => {
      const baseFeeAsBigInt = Number(baseFee);
      const maxPriorityFeePerGasAsBigInt = Number(speed.suggestedMaxPriorityFeePerGas);
      const feeInGwei = ((baseFeeAsBigInt + maxPriorityFeePerGasAsBigInt) * estimatedGas).toFixed(6);
      const feeInWei = toWei(feeInGwei, 'gwei');
      return Number(fromWei(feeInWei, 'ether')).toFixed(7);
    }

    return {
      protocol: SupportedProtocols.Ethereum,
      estimatedGas: Number(estimatedGas),
      baseFee: suggestions.estimatedBaseFee,
      low: {
        suggestedMaxFeePerGas: Number(toWei(suggestions.low.suggestedMaxFeePerGas, 'gwei')),
        suggestedMaxPriorityFeePerGas: Number(toWei(suggestions.low.suggestedMaxPriorityFeePerGas, 'gwei')),
        amount: calculateAmountForSpeed(suggestions.estimatedBaseFee, estimatedGas, suggestions.low),
      },
      medium: {
        suggestedMaxFeePerGas: Number(toWei(suggestions.medium.suggestedMaxFeePerGas, 'gwei')),
        suggestedMaxPriorityFeePerGas: Number(toWei(suggestions.medium.suggestedMaxPriorityFeePerGas, 'gwei')),
        amount: calculateAmountForSpeed(suggestions.estimatedBaseFee, estimatedGas, suggestions.medium)
      },
      high: {
        suggestedMaxFeePerGas: Number(toWei(suggestions.high.suggestedMaxFeePerGas, 'gwei')),
        suggestedMaxPriorityFeePerGas: Number(toWei(suggestions.high.suggestedMaxPriorityFeePerGas, 'gwei')),
        amount: calculateAmountForSpeed(suggestions.estimatedBaseFee, estimatedGas, suggestions.high),
      }
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
    const updatingStatus = NetworkStatus.createFrom(status);
    try {
      const id = Math.random().toString(36).substring(7);
      const response = await globalThis.fetch(network.rpcUrl, {
        method: 'post',
        headers:{
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: ['', 'latest'],
        }),
      });

      if (response.ok) {
        updatingStatus.updateBalanceStatus(true);
      }
    } catch (e) {
      console.log(e);
      updatingStatus.updateBalanceStatus(false);
    }

    return updatingStatus;
  }

  async getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    const updatedStatus = NetworkStatus.createFrom(status);

    const url = SUGGESTED_GAS_FEES_URL.replace(':chainid', network.chainID);

    const ethClient = this.getEthClient(network);

    let suggestions: SuggestedFees;

    try {
      await ethClient.estimateGas({});
      const suggestionsResponse = await globalThis.fetch(url);
      suggestions = await suggestionsResponse.json();
      updatedStatus.updateFeeStatus(true);
    } catch (e) {
      updatedStatus.updateFeeStatus(false);
    }

    return updatedStatus;
  }

  async getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    throw new Error('Not Implemented')
  }

  async getNetworkStatus(network: INetwork): Promise<NetworkStatus> {
    this.validateNetwork(network);
    const updatingStatus = new NetworkStatus();
    const withFeeStatus = await this.getNetworkFeeStatus(network, updatingStatus);
    return await this.getNetworkBalanceStatus(network, withFeeStatus);
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

  private validateFeeRequestOptions(options: EthereumNetworkFeeRequestOptions) {
    try {
      EthereumProtocolFeeRequestSchema.parse(options);
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
