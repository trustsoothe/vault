import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import ProtocolServiceSpecFactory from '../IProtocolService.specFactory';
import {
  AccountReference,
  EthereumNetworkProtocolService,
  SupportedProtocols,
  IEncryptionService,
  ArgumentError,
  NetworkRequestError,
  EthereumNetworkFeeRequestOptions,
  IAsset,
  INetwork,
  SignTypedDataRequest,
  SignPersonalDataRequest,
} from '@poktscan/vault';
import { WebEncryptionService } from '@poktscan/vault-encryption-web';
import {MockServerFactory} from '../../../../../mocks/mock-server-factory';

describe('EthereumNetworkProtocolService', () => {
  const asset: IAsset = {
    protocol: SupportedProtocols.Ethereum,
    chainID: '11155111',
    contractAddress: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
    decimals: 8,
  };

  const network : INetwork = {
    rpcUrl: 'http://localhost:8080',
    protocol: asset.protocol,
    chainID: '11155111',
  };

  const account = new AccountReference({
    id: 'account-id',
    name: 'test-account',
    address: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
    protocol: SupportedProtocols.Ethereum,
  });

  const accountImport = {
    privateKey:
      'e65700becfed73028e0d00d81217e9bfd5db4af9cbc960493b6ffa5633e98797',
    publicKey:
      '0x7ff21bc4f68979598e3f9e47bb814a9a3115678b0a577050af08bcb2af0826cb16d4901b7e913f05dcdc57b874bc9f73e8ebe08737704e2c005398466a8f918f',
    address: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
  };

  const encryptionService: IEncryptionService = new WebEncryptionService();
  const protocolService = new EthereumNetworkProtocolService(encryptionService);

  ProtocolServiceSpecFactory<SupportedProtocols.Ethereum>(
    () => protocolService,
    { asset, network, account, accountImport }
  );

  describe('getFee', () => {
    describe('validations', () => {
      test('throws if undefined is provided as the network', () => {
        // @ts-ignore
        return expect(protocolService.getFee(undefined)).rejects.toThrow(ArgumentError);
      })

      test('throws if null is provided as the network', () => {
        // @ts-ignore
        return expect(protocolService.getFee(null)).rejects.toThrow(ArgumentError);
      })

      test('throws if non Network object is provided as the network', () => {
        // @ts-ignore
        return expect(protocolService.getFee({})).rejects.toThrow(ArgumentError);
      })

      test('throws if undefined is provided as the options', () => {
        // @ts-ignore
        return expect(protocolService.getFee(network, undefined)).rejects.toThrow(ArgumentError);
      })

      test('throws if an invalid fee request option is passed', () => {
        // @ts-ignore
        return expect(protocolService.getFee(network, {})).rejects.toThrow(ArgumentError);
      })
    })

    describe('Successful requests', () => {
      const mockServer = new MockServerFactory(network);
      const server = mockServer.addSuccessfulQueryFeeHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('returns the fee of the network', async () => {
        const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
          protocol: SupportedProtocols.Ethereum,
          to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
        };

        const fee = await protocolService.getFee(network, feeRequestOptions);

        const expectedFee = {
          protocol: SupportedProtocols.Ethereum,
          estimatedGas: 31500,
          baseFee: '0.000000444',
          low: {
            suggestedMaxPriorityFeePerGas: 1000000000,
            suggestedMaxFeePerGas: 1000000444,
            amount: '0.0000315',
          },
          medium: {
            suggestedMaxPriorityFeePerGas: 1500000000,
            suggestedMaxFeePerGas: 1500000600,
            amount: '0.0000473',
          },
          high: {
            suggestedMaxPriorityFeePerGas: 2000000000,
            suggestedMaxFeePerGas: 2000000755,
            amount: '0.0000630',
          },
        };

        expect(expectedFee).toStrictEqual(fee);
      })

      describe('when a site provides gasLimit', () => {
        test('uses the provided gasLimit', async () => {
          const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
            protocol: SupportedProtocols.Ethereum,
            to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
            gasLimit: 100000,
          };

          const fee = await protocolService.getFee(network, feeRequestOptions);

          expect(fee).toEqual(expect.objectContaining({
            estimatedGas: 100000,
          }))
        });
        test('calculates the site fee based on the provided gasLimit (uses medium suggestions)', async () => {
          const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
            protocol: SupportedProtocols.Ethereum,
            to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
            gasLimit: 100000,
          };

          const fee = await protocolService.getFee(network, feeRequestOptions);

          expect(fee).toEqual(expect.objectContaining({
            site: {
              suggestedMaxPriorityFeePerGas: 1500000000,
              suggestedMaxFeePerGas: 1500000600,
              amount: '0.0001500',
            },
          }))
        });
      });

      describe('when the site provides a maxFeePerGas', () => {
        test('uses the provided maxFeePerGas to calculate the site', async () => {
          const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
            protocol: SupportedProtocols.Ethereum,
            to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
            maxFeePerGas: '5',
          };

          const fee = await protocolService.getFee(network, feeRequestOptions);

          expect(fee).toEqual(expect.objectContaining({
            site: {
              suggestedMaxPriorityFeePerGas: 1500000000,
              suggestedMaxFeePerGas: 5000000000,
              amount: '0.0000473',
            },
          }))
        });
      });

      describe('when the site provides a maxPriorityFeePerGas', () => {
        test('uses the provided maxFeePerGas to calculate the site', async () => {
          const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
            protocol: SupportedProtocols.Ethereum,
            to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
            maxPriorityFeePerGas: '2.0',
          };

          const fee = await protocolService.getFee(network, feeRequestOptions);

          expect(fee).toEqual(expect.objectContaining({
            site: {
              suggestedMaxPriorityFeePerGas: 2000000000,
              suggestedMaxFeePerGas: 1500000600,
              amount: '0.0000630',
            },
          }))
        });
      });

    })

    describe('Unsuccessful requests', () => {
      const mockServer = new MockServerFactory(network);
      const server = mockServer.addFailedQueryFeeHandler().buildServer();

      beforeAll(() => server.listen());

      afterEach(() => server.resetHandlers());

      afterAll(() => server.close());

      test('throws a request error if request fails', () => {
        const feeRequestOptions: EthereumNetworkFeeRequestOptions = {
          protocol: SupportedProtocols.Ethereum,
          to: '0x3F56d4881EB6Ae4b6a6580E7BaF842860A0D2465',
        };

        return expect(protocolService.getFee(network, feeRequestOptions)).rejects.toThrow(NetworkRequestError)
      })
    })
  })

  describe('getBalance - ERC20', () => {
    const mockServer = new MockServerFactory(network);
    const server = mockServer.addSuccessfulQueryBalanceHandler().buildServer();

    beforeAll(() => server.listen());

    afterEach(() => server.resetHandlers());

    afterAll(() => server.close());

    test('returns the balance of the account', async () => {
      const balance = await protocolService.getBalance(account, network, asset)
      expect(balance).toBe(408.71715)
    })
  })

  describe('signTypedData', () => {
    const exampleData: Record<string, [any, string]> = {
      simplePerson: [
        {
          types: {
            EIP712Domain: [
              {
                name: 'name',
                type: 'string'
              }
            ],
            Person: [
              {
                name: 'name',
                type: 'string'
              },
              {
                name: 'wallet',
                type: 'address'
              }
            ],
          },
          primaryType: 'Person',
          domain: {
            name: 'Simple Person',
          },
          message: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
          }
        },
        '0x447e1aed4610ca83a24658ab9b4a729843b83d6df1ccc07c74b3c14a14c9f3062e5db48c6cc892cafe0a63d901fbde855946a4abd30679391f2baaf08658a6e41c'
      ],
      ethMail: [
        {
          types: {
            EIP712Domain: [
              {
                name: 'name',
                type: 'string'
              },
              {
                name: 'version',
                type: 'string'
              },
              {
                name: 'chainId',
                type: 'uint256'
              },
              {
                name: 'verifyingContract',
                type: 'address'
              }
            ],
            Person: [
              {
                name: 'name',
                type: 'string'
              },
              {
                name: 'wallet',
                type: 'address'
              }
            ],
            Mail: [
              {
                name: 'from',
                type: 'Person'
              },
              {
                name: 'to',
                type: 'Person'
              },
              {
                name: 'contents',
                type: 'string'
              }
            ]
          },
          primaryType: 'Mail',
          domain: {
            name: 'Ether Mail',
            version: '1',
            chainId: 1,
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
          },
          message: {
            from: {
              name: 'Cow',
              wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
            },
            to: {
              name: 'Bob',
              wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
            },
            contents: 'Hello, Bob!'
          }
        },
        '0xfba508a4beabffdd277db322c083e4a5ef234381a0f62fb03285f48dc4d09df038c5a3db6635503a6303a4d5a283b518edc99f76aba15664296c30123e1acc381b',
      ],
      ethMailGoerli: [
        {
          types: {
            EIP712Domain: [
              {
                name: 'name',
                type: 'string'
              },
              {
                name: 'version',
                type: 'string'
              },
              {
                name: 'chainId',
                type: 'uint256'
              },
              {
                name: 'verifyingContract',
                type: 'address'
              }
            ],
            Person: [
              {
                name: 'name',
                type: 'string'
              },
              {
                name: 'wallet',
                type: 'address'
              }
            ],
            Mail: [
              {
                name: 'from',
                type: 'Person'
              },
              {
                name: 'to',
                type: 'Person'
              },
              {
                name: 'contents',
                type: 'string'
              }
            ]
          },
          primaryType: 'Mail',
          domain: {
            name: 'Ether Mail',
            version: '1',
            chainId: 5,
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
          },
          message: {
            from: {
              name: 'Cow',
              wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
            },
            to: {
              name: 'Bob',
              wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
            },
            contents: 'Hello, Bob!'
          }
        },
        '0x84b6ef34ca87c46343f5d74117b9fa40f9ea1440750183168527442401465a28107c99238d5026ceb13013722988becb0de5363186532d9b659f8a40e556d82e1c',
      ],
      ethMailNoChainID: [
        {
          types: {
            EIP712Domain: [
              {
                name: 'name',
                type: 'string'
              },
              {
                name: 'version',
                type: 'string'
              },
              {
                name: 'verifyingContract',
                type: 'address'
              }
            ],
            Person: [
              {
                name: 'name',
                type: 'string'
              },
              {
                name: 'wallet',
                type: 'address'
              }
            ],
            Mail: [
              {
                name: 'from',
                type: 'Person'
              },
              {
                name: 'to',
                type: 'Person'
              },
              {
                name: 'contents',
                type: 'string'
              }
            ]
          },
          primaryType: 'Mail',
          domain: {
            name: 'Ether Mail',
            version: '1',
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
          },
          message: {
            from: {
              name: 'Cow',
              wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
            },
            to: {
              name: 'Bob',
              wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
            },
            contents: 'Hello, Bob!'
          }
        },
        '0x7fadf36cc9d70033bb1a38174877dfb14cf85cc3d34113b988a5d64aad8847ab12c63d53102c9e67985b888867bd1f687d4faff67de681a4ff32aaf760c693931c',
      ],
    }

    test.each(Object.values(exampleData))('Successfully signs the provided typed data', async (data: any, expectedSignature: string) => {
      const signTypedDataRequest: SignTypedDataRequest = {
        data,
        privateKey: accountImport.privateKey,
      }
      const signature = await protocolService.signTypedData(signTypedDataRequest);
      expect(expectedSignature).toEqual(signature);
    });
  })

  describe('signPersonalData', () => {
    const testCaseExpectations: [string, string][] = [
        ['0x68656c6c6f', '0xf472938b71c3622eb2d57c8a0430fba4ed301b68960db4515e63b215f6812d16741188cda9076426dc32bb992571b7766bcdeecff30f7069e3b16469bc666f7a1b'],
        ['0x48656c6c6f2c20776f726c6421', '0xdcd198b7f7b238656a2f937688158991f80c06667c371cb2158399563cb4e3dc79d359fc7d91383a4a0fa2f1ae42723c3cc7742c3a7a13ed2b7b02d69593d74c1b'],
    ]

    test.each(testCaseExpectations)('For: %s it resolves to: %s', async (challenge, expectedSignature) => {
        const input: SignPersonalDataRequest = {
          challenge,
          privateKey: accountImport.privateKey,
        }

        const signature = await protocolService.signPersonalData(input);

        expect(expectedSignature).toEqual(signature);
    })
  })
});
