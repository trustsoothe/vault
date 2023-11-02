export class NetworkStatus {
  private _fee: boolean = false;
  private _feeStatusLastUpdated: number = 0;
  private _balance: boolean = false;
  private _balanceStatusLastUpdated: number = 0;
  private _sendTransaction: boolean = false;
  private _sendTransactionStatusLastUpdated: number = 0;

  static createFrom(originStatus?: NetworkStatus): NetworkStatus {
    const status = new NetworkStatus();

    if (!originStatus) {
      return status;
    }

    status._fee = originStatus._fee;
    status._feeStatusLastUpdated = originStatus._feeStatusLastUpdated;
    status._balance = originStatus._balance;
    status._balanceStatusLastUpdated = originStatus._balanceStatusLastUpdated;
    status._sendTransaction = originStatus._sendTransaction;
    status._sendTransactionStatusLastUpdated = originStatus._sendTransactionStatusLastUpdated;

    return status;
  }

  updateFeeStatus(status: boolean) {
    this._fee = status;
    this._feeStatusLastUpdated = Date.now();
  }

  updateBalanceStatus(status: boolean) {
    this._balance = status;
    this._balanceStatusLastUpdated = Date.now();
  }

  updateSendTransactionStatus(status: boolean) {
    this._sendTransaction = status;
    this._sendTransactionStatusLastUpdated = Date.now();
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
