import {
  AddHDWalletAccountOptions,
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions, DeriveAddressOptions,
  ImportRecoveryPhraseOptions,
  IProtocolService, SignPersonalDataRequest,
  ValidateTransactionResult
} from "../IProtocolService";
import {AccountReference, SupportedProtocols} from "../../values";
import {INetwork} from "../INetwork";
import {IAsset} from "../IAsset";
import {NetworkStatus} from "../../values/NetworkStatus";
import {IProtocolTransactionResult, ProtocolTransaction} from "../ProtocolTransaction";
import {Account, AccountType} from "../../../vault";
import {IEncryptionService} from "../../encryption/IEncryptionService";
import {CosmosProtocolTransaction} from "./CosmosProtocolTransaction";
import {fromHex, toHex, toUtf8} from "@cosmjs/encoding";
import {ArgumentError, InvalidPrivateKeyError, NetworkRequestError, RecoveryPhraseError} from "../../../../errors";
import {coins, DirectSecp256k1HdWallet, DirectSecp256k1Wallet} from "@cosmjs/proto-signing";
import {Bip39, EnglishMnemonic, Random, Secp256k1, sha256, Slip10, Slip10Curve} from "@cosmjs/crypto";
import {CosmosFee} from "./CosmosFee";
import {
  CosmosProtocolTransactionSchema,
  PocketShannonProtocolNetworkSchema,
  PocketShannonRpcCanSendTransactionResponseSchema
} from "./schemas";
import {calculateFee, GasPrice, SigningStargateClient, StargateClient, TimeoutError} from "@cosmjs/stargate";
import { makeCosmoshubPath } from '@cosmjs/amino';
import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

export class CosmosProtocolService
  implements IProtocolService<SupportedProtocols.Cosmos>
{
  constructor(private encryptionService: IEncryptionService) {}

  async createAccount(options: CreateAccountOptions): Promise<Account> {
    const privateKey = Random.getBytes(32);

    return this.createAccountFromPrivateKey({
      ...options,
      privateKey: toHex(privateKey),
    });
  }

  async createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account> {
    if (!options.protocol) {
      throw new ArgumentError("options.protocol");
    }

    if (!options.passphrase && !options.skipEncryption) {
      throw new ArgumentError("options.passphrase");
    }

    if (!options.privateKey) {
      throw new ArgumentError("options.privateKey");
    }

    if (!this.isValidPrivateKey(options.privateKey)) {
      throw new InvalidPrivateKeyError(options.privateKey);
    }

    if (!options.addressPrefix) {
      throw new ArgumentError("options.addressPrefix");
    }

    let finalPrivateKey = options.privateKey;

    if (options.passphrase) {
      finalPrivateKey = await this.encryptionService.encrypt(
        options.passphrase,
        options.privateKey
      );
    }

    const wallet = await DirectSecp256k1Wallet.fromKey(fromHex(options.privateKey), options.addressPrefix);
    const [account] = await wallet.getAccounts();

    return new Account({
      name: options.name,
      protocol: options.protocol,
      address: account.address,
      publicKey: toHex(account.pubkey),
      privateKey: finalPrivateKey,
      secure: !options.skipEncryption,
      addressPrefix: options.addressPrefix,
    });
  }

  async createAccountsFromRecoveryPhrase(options: ImportRecoveryPhraseOptions): Promise<Account[]> {
    const isValidMnemonic = validateMnemonic(options.recoveryPhrase, wordlist);

    if (!isValidMnemonic) {
      throw new RecoveryPhraseError("Invalid recovery phrase");
    }

    const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(options.recoveryPhrase));

    const seedAccount =  new Account({
        name: options.seedAccountName || "HD Account",
        seedId: options.recoveryPhraseId,
        accountType: AccountType.HDSeed,
        protocol: SupportedProtocols.Cosmos,
        publicKey: 'N/A',
        privateKey: toHex(seed),
        address: "N/A",
        secure: false,
        addressPrefix: options.addressPrefix,
    });

    const hdPath = makeCosmoshubPath(0);
    const wallet: DirectSecp256k1HdWallet = await DirectSecp256k1HdWallet.fromMnemonic(options.recoveryPhrase, { prefix: options.addressPrefix, hdPaths: [hdPath]});
    const [account] = await wallet.getAccounts();
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);

    const childAccount = new Account({
      publicKey: toHex(account.pubkey),
      address: account.address,
      name: `${seedAccount.name} 1`,
      accountType: AccountType.HDChild,
      protocol: SupportedProtocols.Cosmos,
      privateKey: toHex(privkey),
      parentId: seedAccount.id,
      hdwIndex: 0,
      hdwAccountIndex: 0, // TODO: Parameterize this if we will allow users to use more than one account from the same seeds
      secure: false, // TODO: Parameterize this if we will allow users to set a password per account
      addressPrefix: options.addressPrefix,
    })

    return [
      seedAccount,
      childAccount,
    ];
  }

  async createHDWalletAccount(options: AddHDWalletAccountOptions): Promise<Account> {
    const { seedAccount, index, name } = options;
    const hdPath = makeCosmoshubPath(index);
    const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, fromHex(seedAccount.privateKey), hdPath);
    const wallet = await DirectSecp256k1Wallet.fromKey(privkey, options.addressPrefix);
    const [account] = await wallet.getAccounts();
    return new Account({
      publicKey: toHex(account.pubkey),
      address: account.address,
      name: name ? name : `${seedAccount.name} ${index + 1}`,
      accountType: AccountType.HDChild,
      protocol: SupportedProtocols.Cosmos,
      privateKey: toHex(privkey),
      parentId: seedAccount.id,
      hdwIndex: index,
      hdwAccountIndex: 0, // TODO: Parameterize this if we will allow users to use more than one account from the same seeds
      secure: false, // TODO: Parameterize this if we will allow users to set a password per account
      addressPrefix: options.addressPrefix,
    });
  }

  async getAddressFromPrivateKey(options: DeriveAddressOptions): Promise<string> {
    if (!this.isValidPrivateKey(options.privateKey)) {
      throw new InvalidPrivateKeyError(options.privateKey);
    }

    if (!options.addressPrefix) {
      throw new ArgumentError("options.addressPrefix");
    }

    const wallet = await DirectSecp256k1Wallet.fromKey(fromHex(options.privateKey), options.addressPrefix);
    const [account] = await wallet.getAccounts();
    return account.address;
  }

  async getBalance(account: AccountReference, network: INetwork, asset?: IAsset): Promise<number> {
    this.validateNetwork(network);

    try {
      const client = await StargateClient.connect(network.rpcUrl);
      const balances = await client.getAllBalances(account.address);
      const upoktBalance = balances.find((balance) => balance.denom === "upokt");

      if (!upoktBalance) {
        return 0;
      }

      return parseInt(upoktBalance.amount);
    } catch (err) {
      console.error(err);
      throw new NetworkRequestError("Failed to fetch balance");
    }
  }

  async getFee(network: INetwork): Promise<CosmosFee> {
    // @ts-ignore
    return {
      protocol: SupportedProtocols.Cosmos,
      value: 0,
      denom: 'upokt',
    };
  }

  async getNetworkBalanceStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    this.validateNetwork(network);
    const updatedStatus = NetworkStatus.createFrom(status);

    try {
      await this.getBalance(new AccountReference({
        id: "faucet",
        name: "faucet",
        publicKey: "N/A",
        address: "pokt1v3mcrj0h2zfekyf2n8m369x4v9wfvdm34hecd9",
        protocol: SupportedProtocols.Cosmos,
      }), network);
      updatedStatus.updateBalanceStatus(true);
    } catch (err) {
      updatedStatus.updateBalanceStatus(false);
    }

    return updatedStatus;
  }

  async getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    this.validateNetwork(network);
    const updatedStatus = NetworkStatus.createFrom(status);

    try {
      await this.getFee(network);
      updatedStatus.updateFeeStatus(true);
    } catch (err) {
      updatedStatus.updateFeeStatus(false);
    }

    return updatedStatus;
  }

  async getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    this.validateNetwork(network);

    const updatedStatus = NetworkStatus.createFrom(status);

    const response = await globalThis.fetch(network.rpcUrl, {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.floor(Math.random() * 1000000000),
        method: 'broadcast_tx_sync',
        params: {
          path: '',
          data: '',
          prove: false
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      updatedStatus.updateSendTransactionStatus(false);
      return updatedStatus;
    }

    const responseRawBody = await response.json();

    try {
      PocketShannonRpcCanSendTransactionResponseSchema.parse(responseRawBody);
      updatedStatus.updateSendTransactionStatus(true);
    } catch (e) {
      updatedStatus.updateSendTransactionStatus(false);
    }

    return updatedStatus;
  }

  async getNetworkStatus(network: INetwork): Promise<NetworkStatus> {
    const withFeeStatus = await this.getNetworkFeeStatus(network);
    const withFeeAndBalanceStatus = await this.getNetworkBalanceStatus(
      network,
      withFeeStatus
    );
    return await this.getNetworkSendTransactionStatus(
      network,
      withFeeAndBalanceStatus
    );
  }

  async sendTransaction(network: INetwork, transaction: CosmosProtocolTransaction, asset?: IAsset): Promise<IProtocolTransactionResult<SupportedProtocols.Cosmos>> {
    if (!network) {
      throw new ArgumentError("network");
    }

    if (!transaction) {
      throw new ArgumentError("transaction");
    }

    const {success} = CosmosProtocolTransactionSchema.safeParse(transaction);

    if (!success) {
      throw new ArgumentError("transaction");
    }

    try {
      const {privateKey, from, to, amount, fee: providedFee} = transaction;
      const wallet = await DirectSecp256k1Wallet.fromKey(fromHex(privateKey), "pokt");
      const [{ address: derivedAddress }] = await wallet.getAccounts();
      if (derivedAddress !== from) {
        throw new Error(`The provided fromAddress does not match the address derived from the private key. Derived: ${derivedAddress}, Provided: ${from}`);
      }

      const client = await SigningStargateClient.connectWithSigner(network.rpcUrl, wallet);
      const amountInUpokt = parseInt(amount) * 1e6;
      const amountFinal = coins(amountInUpokt, 'upokt');

      const gasPrice = GasPrice.fromString(`${providedFee?.value ?? 0}${providedFee?.denom ?? 'upokt'}`);
      const fee = calculateFee(200000, gasPrice);

      const tx = {
        msgs: [
          {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
              fromAddress: from,
              toAddress: to,
              amount: amountFinal,
            },
          },
        ],
        fee,
        memo: "",
      };

      const transactionHash = await client.signAndBroadcastSync(from, tx.msgs, tx.fee, tx.memo);

      return {
        protocol: SupportedProtocols.Cosmos,
        transactionHash,
      };
    } catch (err) {
      if (err instanceof TimeoutError) {
        return {
          protocol: SupportedProtocols.Cosmos,
          transactionHash: err.txId
        };
      }

      throw err;
    }
  }

  async signPersonalData(request: SignPersonalDataRequest): Promise<string> {
    const { privateKey, challenge } = request;
    const privateKeyBytes = fromHex(privateKey);
    const messageHash = sha256(toUtf8(challenge));
    const signature = await Secp256k1.createSignature(messageHash, privateKeyBytes);
    return toHex(signature.toFixedLength());
  }

  async validateTransaction(transaction: ProtocolTransaction<SupportedProtocols.Cosmos>, network: INetwork): Promise<ValidateTransactionResult> {
    return new ValidateTransactionResult([]);
  }

  isValidPrivateKey(privateKey: string): boolean {
    const privateKeyAsUint = fromHex(privateKey);

    if (privateKeyAsUint.length !== 32) {
      console.error("Invalid private key length. Must be 32 bytes.");
      return false;
    }

    const n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"); // Order of the Secp256k1 curve
    const privateKeyValue = BigInt(`0x${toHex(privateKeyAsUint)}`);
    if (privateKeyValue <= 0 || privateKeyValue >= n) {
      console.error("Invalid private key value. Must be between 1 and n - 1.");
      return false;
    }

    return true;
  }

  private validateNetwork(network: INetwork) {
    try {
      PocketShannonProtocolNetworkSchema.parse(network);
    } catch {
      throw new ArgumentError("network");
    }
  }
}
