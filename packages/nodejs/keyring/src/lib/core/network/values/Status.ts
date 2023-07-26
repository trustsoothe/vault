import {SerializedNetwork} from "../index";

export class Status {
  private _fee: boolean = false;
  private _feeStatusLastUpdated: number = 0;
  private _balance: boolean = false;
  private _balanceStatusLastUpdated: number = 0;
  private _sendTransaction: boolean = false;
  private _sendTransactionStatusLastUpdated: number = 0;

  constructor(serializedNetwork?: SerializedNetwork) {
    if (serializedNetwork) {
      this._fee = serializedNetwork.status.fee;
      this._feeStatusLastUpdated = serializedNetwork.status.feeStatusLastUpdated || 0;
      this._balance = serializedNetwork.status.balance;
      this._balanceStatusLastUpdated = serializedNetwork.status.balanceStatusLastUpdated || 0;
      this._sendTransaction = serializedNetwork.status.sendTransaction;
      this._sendTransactionStatusLastUpdated = serializedNetwork.status.sendTransactionStatusLastUpdated || 0;
    }
  }

  updateFeeStatus(status: boolean) {
   throw new Error('Not implemented');
  }

  updateBalanceStatus(status: boolean) {
    throw new Error('Not implemented');
  }

  updateSendTransactionStatus(status: boolean) {
    throw new Error('Not implemented');
  }

  get canProvideFee(): boolean {
    return this._fee;
  }

  get feeStatusLastUpdated(): number {
    return this._feeStatusLastUpdated;
  }

  get canProvideBalance(): boolean {
    return this._balance;
  }

  get balanceStatusLastUpdated(): number {
    return this._balanceStatusLastUpdated;
  }

  get canSendTransaction(): boolean {
    return this._sendTransaction;
  }

  get sendTransactionStatusLastUpdated(): number {
    return this._sendTransactionStatusLastUpdated;
  }
}
