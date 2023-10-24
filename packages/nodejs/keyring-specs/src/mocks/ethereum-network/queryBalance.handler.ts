import Url from "node:url";
import {rest} from "msw";
import {withMethod} from "./withMethod";
import {INetwork} from "@poktscan/keyring";

export const queryBalanceHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);
  // @ts-ignore
  const resolver = async (req, res, ctx) => {
    const {id} = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        id,
        jsonrpc: "2.0",
        result: "0xC8", // 200 in hex
      }),
    );
  };

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_getBalance', resolver))
  ];
}

export const queryBalanceFailureHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);

  // @ts-ignore
  const resolver = (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({}),
    );
  };

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_getBalance', resolver)),
  ];
}
