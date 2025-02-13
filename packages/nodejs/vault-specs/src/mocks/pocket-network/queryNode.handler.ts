import { rest } from 'msw'
import Url from 'node:url'
import urlJoin from 'url-join'
import { INetwork } from '@soothe/vault'

export const queryNodeHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(urlJoin(network.rpcUrl, '/v1/query/node'))
  return [
    rest.post<{ address: string }>(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          address: req.body.address,
          chains: [
            '0004',
            '0005',
            '0009',
            '0021',
            '0049',
            '0052',
            '0066',
            '0079',
          ],
          jailed: false,
          output_address: '42049719c452dffd499e60f5f7f74d7b1c5ff069',
          public_key: 'af6c2cacd7070eda73ed7b142f88b5d9581b08210aaf609abe336ba36489c5b9',
          reward_delegators: {
            '9ff96f1c187ef19e85e6f5b56ace902429c2f925': 20,
          },
          service_url: 'https://a931db71f2d88e479b259dad6ea02dae9f83b70c.tango.poktscan.cloud:443',
          status: 2,
          tokens: '15002000000',
          unstaking_time: '0001-01-01T00:00:00Z',
        }),
      )
    }),
  ]
}

export const queryNodeFailureHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(urlJoin(network.rpcUrl, '/v1/query/balance'))
  return [
    rest.post(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(500),
      )
    }),
  ]
}
