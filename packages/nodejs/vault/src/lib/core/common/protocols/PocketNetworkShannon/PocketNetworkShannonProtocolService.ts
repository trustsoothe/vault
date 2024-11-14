import {
  AddHDWalletAccountOptions,
  CreateAccountFromPrivateKeyOptions,
  CreateAccountOptions,
  ImportRecoveryPhraseOptions,
  IProtocolService, SignPersonalDataRequest, ValidateTransactionResult
} from "../IProtocolService";
import {AccountReference, SupportedProtocols} from "../../values";
import {undefined} from "zod";
import {INetwork} from "../INetwork";
import {IAsset} from "../IAsset";
import {IAbstractProtocolFeeRequestOptions} from "../ProtocolFeeRequestOptions";
import {ProtocolFee} from "../ProtocolFee";
import {NetworkStatus} from "../../values/NetworkStatus";
import {IProtocolTransactionResult, ProtocolTransaction} from "../ProtocolTransaction";
import {Account} from "../../../vault";
import {IEncryptionService} from "../../encryption/IEncryptionService";
import {PocketNetworkShannonProtocolTransaction} from "./PocketNetworkShannonProtocolTransaction";

export class PocketNetworkShannonProtocolService
  implements IProtocolService<SupportedProtocols.PocketShannon>
{
  constructor(private encryptionService: IEncryptionService) {}

  createAccount(options: CreateAccountOptions): Promise <Account> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  createAccountFromPrivateKey(options: CreateAccountFromPrivateKeyOptions): Promise<Account> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  createAccountsFromRecoveryPhrase(options: ImportRecoveryPhraseOptions): Promise<Account[]> {
    return Promise.resolve([]);
  }

  createHDWalletAccount(options: AddHDWalletAccountOptions): Promise<Account> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  getAddressFromPrivateKey(privateKey: string): Promise<string> {
    return Promise.resolve("");
  }

  getBalance(account: AccountReference, network: INetwork, asset?: IAsset): Promise<number> {
    return Promise.resolve(0);
  }

  getFee(network: INetwork, options?: IAbstractProtocolFeeRequestOptions<SupportedProtocols.PocketShannon>): Promise<ProtocolFee<SupportedProtocols.PocketShannon>> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  getNetworkBalanceStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  getNetworkFeeStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  getNetworkSendTransactionStatus(network: INetwork, status?: NetworkStatus): Promise<NetworkStatus> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  getNetworkStatus(network: INetwork): Promise<NetworkStatus> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  isValidPrivateKey(privateKey: string): boolean {
    return false;
  }

  sendTransaction(network: INetwork, transaction: PocketNetworkShannonProtocolTransaction, asset?: IAsset): Promise<IProtocolTransactionResult<SupportedProtocols.PocketShannon>> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

  signPersonalData(request: SignPersonalDataRequest): Promise<string> {
    return Promise.resolve("");
  }

  validateTransaction(transaction: ProtocolTransaction<SupportedProtocols.PocketShannon>, network: INetwork): Promise<ValidateTransactionResult> {
    // @ts-ignore
    return Promise.resolve(undefined);
  }

}
