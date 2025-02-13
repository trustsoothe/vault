import Url from 'node:url'
import { rest } from 'msw'
import { withMethod } from '../withMethod'
import { INetwork } from '@soothe/vault'

export const queryEstimateGasHandler = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl)
  // @ts-ignore
  const estimateGasResolver = async (req, res, ctx) => {
    const { id } = req.body

    return res(
      ctx.status(200),
      ctx.json({
        id,
        jsonrpc: '2.0',
        result: '0x5208',
      }),
    )
  }

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_estimateGas', estimateGasResolver)),
  ]
}
