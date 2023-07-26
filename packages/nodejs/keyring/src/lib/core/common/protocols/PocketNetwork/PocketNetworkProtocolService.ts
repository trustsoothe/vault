// @ts-ignore
import {fromUint8Array} from 'hex-lite';
import {CreateAccountOptions, IProtocolService} from '../IProtocolService';
import {Account} from "../../../vault";
import {utils,  getPublicKeyAsync} from '@noble/ed25519';
import {Buffer} from "buffer";
import IEncryptionService from "../../encryption/IEncryptionService";
import { Network } from '../../../network';
import {AccountReference} from "../../values";
import fetch from 'isomorphic-fetch'
import * as Path from "path";
import {
  PocketRpcBalanceResponseSchema,
  PocketRpcCanSendTransactionResponseSchema,
  PocketRpcFeeParamsResponseSchema
} from "./schemas";


export class PocketNetworkProtocolService implements IProtocolService {
  constructor(private IEncryptionService: IEncryptionService) {
  }

  async createAccount(options: CreateAccountOptions): Promise<Account> {
    if (!options.asset) {
       throw new Error('Invalid Operation: Asset instance not provided')
    }

    if (!options.passphrase) {
        throw new Error('Invalid Operation: Passphrase instance not provided')
    }

    const shortPrivateKey = utils.randomPrivateKey()
    const publicKey = await getPublicKeyAsync(shortPrivateKey)
    const address = await this.getAddressFromPublicKey(Buffer.from(publicKey).toString('hex'))
    const privateKey = `${Buffer.from(shortPrivateKey).toString('hex')}${Buffer.from(publicKey).toString('hex')}`
    const encryptedPrivateKey = await this.IEncryptionService.encrypt(options.passphrase, privateKey)

    return new Account({
      asset: options.asset,
      name: options.name,
      address,
      publicKey: Buffer.from(publicKey).toString('hex'),
      privateKey: encryptedPrivateKey,
    })
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

  async updateFeeStatus(network: Network): Promise<Network> {
    if (!network || !(network instanceof Network)) {
      throw new Error('Invalid Argument: Network instance not provided')
    }

    const FEE_PARAM_KEY = 'auth/FeeMultipliers'

    const url = Path.join(network.rpcUrl, 'v1/query/param')

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        key: FEE_PARAM_KEY,
      })
    })

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
    if (!network || !(network instanceof Network)) {
      throw new Error('Invalid Argument: Network instance not provided')
    }

    const url = Path.join(network.rpcUrl, 'v1/query/balance')

    const response = await fetch(url, {
      method: 'POST',
    })

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
    if (!network || !(network instanceof Network)) {
      throw new Error('Invalid Argument: Network instance not provided')
    }

    const url = Path.join(network.rpcUrl, 'v1/client/rawtx')

    const response = await fetch(url, {
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
    if (!network || !(network instanceof Network)) {
      throw new Error('Invalid Argument: Network instance not provided')
    }

    await this.updateFeeStatus(network);
    await this.updateBalanceStatus(network);
    await this.updateSendTransactionStatus(network);

    return network;
  }

  getBalance(network: Network, account: AccountReference): Promise<number> {
    return Promise.resolve(0);
  }

  getFee(network: Network): Promise<number> {
    return Promise.resolve(0);
  }
}
