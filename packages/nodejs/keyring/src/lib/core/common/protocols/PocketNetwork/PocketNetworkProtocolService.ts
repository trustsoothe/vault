// @ts-ignore
import {fromUint8Array} from 'hex-lite';
import {
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  IProtocolService
} from '../IProtocolService';
import {Account} from "../../../vault";
import {utils,  getPublicKeyAsync} from '@noble/ed25519';
import {Buffer} from "buffer";
import {IEncryptionService} from "../../encryption/IEncryptionService";
import { Network } from '../../../network';
import {AccountReference} from "../../values";
import urlJoin from "url-join";
import {
  PocketRpcBalanceResponseSchema,
  PocketRpcCanSendTransactionResponseSchema,
  PocketRpcFeeParamsResponseSchema,
  PocketRpcFeeParamsResponseValue,
} from "./schemas";
import {ArgumentError, NetworkRequestError} from "../../../../errors";


export class PocketNetworkProtocolService implements IProtocolService {
  constructor(private IEncryptionService: IEncryptionService) {
  }

  async createAccount(options: CreateAccountOptions): Promise<Account> {
    if (!options.asset) {
      throw new ArgumentError('options.asset');
    }

    if (!options.passphrase && !options.skipEncryption) {
      throw new ArgumentError('options.passphrase');
    }

    const shortPrivateKey = utils.randomPrivateKey()
    const publicKey = await getPublicKeyAsync(shortPrivateKey)
    const address = await this.getAddressFromPublicKey(Buffer.from(publicKey).toString('hex'))
    const privateKey = `${Buffer.from(shortPrivateKey).toString('hex')}${Buffer.from(publicKey).toString('hex')}`
    let finalPrivateKey = privateKey

    if (options.passphrase) {
      finalPrivateKey = await this.IEncryptionService.encrypt(options.passphrase, privateKey)
    }

    return new Account({
      asset: options.asset,
      name: options.name,
      address,
      publicKey: Buffer.from(publicKey).toString('hex'),
      privateKey: finalPrivateKey,
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

    const publicKey = this.getPublicKeyFromPrivateKey(options.privateKey)
    const address = await this.getAddressFromPublicKey(publicKey)
    let finalPrivateKey = options.privateKey
    if (options.passphrase) {
      finalPrivateKey = await this.IEncryptionService.encrypt(options.passphrase, options.privateKey)
    }

    return new Account({
      name: options.name,
      asset: options.asset,
      address,
      publicKey,
      privateKey: finalPrivateKey,
    });
  }

  async updateFeeStatus(network: Network): Promise<Network> {
    this.validateNetwork(network);

    const response = await this.requestFee(network);

    if (!response.ok) {
      network.status.updateFeeStatus(false);
      return network;
    }

    const responseRawBody = await response.json();

    try {
      PocketRpcFeeParamsResponseSchema.parse(responseRawBody);
      network.status.updateFeeStatus(true);
    } catch {
      network.status.updateFeeStatus(false);
    }

    return network;
  }

  async updateBalanceStatus(network: Network): Promise<Network> {
    this.validateNetwork(network);

    const url = urlJoin(network.rpcUrl, 'v1/query/balance')

    const response = await globalThis.fetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      network.status.updateBalanceStatus(false);
      return network;
    }

    const responseRawBody = await response.json();

    try {
      PocketRpcBalanceResponseSchema.parse(responseRawBody);
      network.status.updateBalanceStatus(true);
    } catch {
      network.status.updateBalanceStatus(false);
    }

    return network;
  }

  async updateSendTransactionStatus(network: Network): Promise<Network> {
    this.validateNetwork(network);

    const url = urlJoin(network.rpcUrl, 'v1/client/rawtx')

    const response = await globalThis.fetch(url, {
      method: 'POST',
    })

    if (!response.ok) {
      network.status.updateSendTransactionStatus(false);
      return network;
    }

    const responseRawBody = await response.json();

    try {
      PocketRpcCanSendTransactionResponseSchema.parse(responseRawBody);
      network.status.updateSendTransactionStatus(true);
    } catch (e) {
      network.status.updateSendTransactionStatus(false);
    }

    return network; }

  async updateNetworkStatus(network: Network): Promise<Network> {
    this.validateNetwork(network);
    await this.updateFeeStatus(network);
    await this.updateBalanceStatus(network);
    await this.updateSendTransactionStatus(network);

    return network;
  }

  async getBalance(network: Network, account: AccountReference): Promise<number> {
    this.validateNetwork(network);

    const url = urlJoin(network.rpcUrl, 'v1/query/balance')

    const response = await globalThis.fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        address: account.address,
      })
    });

    if (!response.ok) {
      throw new NetworkRequestError('Failed to fetch balance');
    }

    const responseRawBody = await response.json();
    const balanceResponse = PocketRpcBalanceResponseSchema.parse(responseRawBody);
    return balanceResponse.balance;
  }

  async getFee(network: Network): Promise<number> {
    this.validateNetwork(network);
    const response = await this.requestFee(network);

    if (!response.ok) {
      throw new NetworkRequestError('Failed to fetch fee');
    }

    const responseRawBody = await response.json();

    const feeResponse = PocketRpcFeeParamsResponseValue.parse(responseRawBody);

    return feeResponse.param_value.fee_multiplier;
  }

  private validateNetwork(network: Network) {
    if (!network || !(network instanceof Network)) {
      throw new ArgumentError('network');
    }
  }

  private async requestFee(network: Network) {
    const FEE_PARAM_KEY = 'auth/FeeMultipliers'

    const url = urlJoin(network.rpcUrl, 'v1/query/param')

    // @ts-ignore
    return await globalThis.fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        key: FEE_PARAM_KEY,
      })
    });
  }


  private getPublicKeyFromPrivateKey(privateKey: string): string {
    return privateKey.slice(64, privateKey.length)
  }

  private async getAddressFromPublicKey(
    publicKey: string
  ): Promise<string> {
    // @ts-ignore
    const hash = await globalThis.crypto.subtle.digest(
      {
        name: 'SHA-256',
      },
      this.hexStringToByteArray(publicKey)
    )

    return fromUint8Array(new Uint8Array(hash)).slice(0, 40)
  }

  private  hexStringToByteArray(str: string): Uint8Array {
    const hexRegExp = str.match(/.{1,2}/g)

    if (hexRegExp) {
      return Uint8Array.from(hexRegExp.map((byte) => parseInt(byte, 16)))
    }

    throw new Error('Invalid hex string')
  }

}
