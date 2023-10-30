export interface IAbstractTransferFundsResult<SupportedProtocolTypes> {
  protocol: SupportedProtocolTypes;
  transactionHash: string;
}

