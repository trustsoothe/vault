import Url from 'node:url'
import { rest } from 'msw'
import { withMethod } from '../withMethod'
import { INetwork } from '@soothe/vault'

export const queryBalanceHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl)
  // @ts-ignore
  const eth_getBalanceResolver = async (req, res, ctx) => {
    const { id } = await req.json()
    return res(
      ctx.status(200),
      ctx.json({
        id,
        jsonrpc: '2.0',
        result: '0xC8', // 200 in hex
      }),
    )
  }

  // @ts-ignore
  const ethCall_Resolver = async (req, res, ctx) => {
    const { id } = await req.json()
    return res(
      ctx.status(200),
      ctx.json({
        id,
        jsonrpc: '2.0',
        result: '0x000000000000000000000000000000000000000000000000000000098424e036', // 40871714870 in hex
      }),
    )
  }

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_getBalance', eth_getBalanceResolver)),
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_call', ethCall_Resolver)),
  ]
}

export const queryBalanceFailureHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl)

  // @ts-ignore
  const resolver = (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({}),
    )
  }

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_getBalance', resolver)),
  ]
}
