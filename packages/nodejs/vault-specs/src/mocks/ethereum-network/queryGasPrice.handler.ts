import {INetwork} from "@poktscan/vault";
import {rest} from "msw";
import {withMethod} from "./withMethod";
import Url from "node:url";

export const queryGasPriceHandler = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);

  // @ts-ignore
  const gasPriceResolver = async (req, res, ctx) => {
    const {id} = req.body;

    return res(
      ctx.status(200),
      ctx.json({
        id,
        jsonrpc: '2.0',
        result: '0x5d21dba01', // 25000000001 wei
      }),
    );
  };

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_gasPrice', gasPriceResolver)),
  ];
}

export const queryGasPriceFailureHandler = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);

  // @ts-ignore
  const gasPriceFailureResolver = async (req, res, ctx) => {
    const {id} = req.body;

    return res(
      ctx.status(200),
      ctx.json({
        id,
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not found',
        },
      }),
    );
  };

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_gasPrice', gasPriceFailureResolver)),
  ];
}
