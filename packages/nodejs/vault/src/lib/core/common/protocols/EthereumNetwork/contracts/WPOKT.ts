export default [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'poktAddress',
        type: 'address'
      }
    ],
    name: 'burnAndBridge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;
