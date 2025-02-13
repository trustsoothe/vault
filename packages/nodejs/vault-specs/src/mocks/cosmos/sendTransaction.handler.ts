import { rest } from 'msw'
import Url from 'node:url'

import { INetwork } from '@soothe/vault'
import { queryStatusResolver } from './queryStatus.handler'
import { withCosmosMethod } from '../withCosmosMethod'

export const sendTransactionHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl)

  // @ts-ignore
  const sendTransactionResolver = async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        jsonrpc: '2.0',
        id: 476496532578,
        result: {
          code: 0,
          data: '',
          log: '',
          codespace: '',
          hash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
        },
      }),
    )
  }

  return [
    // @ts-ignore
    rest.post(url.toString(), withCosmosMethod('broadcast_tx_sync', sendTransactionResolver)),
  ]
}
