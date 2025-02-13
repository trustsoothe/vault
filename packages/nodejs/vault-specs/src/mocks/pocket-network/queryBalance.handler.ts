import { rest } from 'msw'
import Url from 'node:url'
import urlJoin from 'url-join'
import { INetwork } from '@soothe/vault'

export const queryBalanceHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(urlJoin(network.rpcUrl, '/v1/query/balance'))
  return [
    rest.post(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          balance: 200,
        }),
      )
    }),
  ]
}

export const queryBalanceFailureHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(urlJoin(network.rpcUrl, '/v1/query/balance'))
  return [
    rest.post(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(500),
      )
    }),
  ]
}
