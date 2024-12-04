import {rest} from "msw";
import Url from 'node:url';
import {INetwork} from "@poktscan/vault";
import {withCosmosMethod} from "../withCosmosMethod";

// @ts-ignore
export const queryTransactionNotFoundResolver = async (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({
      jsonrpc: "2.0",
      id: 117358427644,
      result: {
        txs: [],
        total_count: '0',
      },
    }),
  );
};

export const queryTransactionHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);

  return [
    // @ts-ignore
    rest.post(url.toString(), withCosmosMethod('tx_search', queryTransactionNotFoundResolver)),
  ];
}

export const queryTransactionFailureHandlerFactory = (network: INetwork) => {
  return [
    rest.post(network.rpcUrl, async (req, res, ctx) => {
      return res(
        ctx.status(500),
      );
    }),
  ];
}
