import Url from "node:url";
import {rest} from "msw";
import {INetwork} from "@poktscan/vault";
import {withMethod} from "../withMethod";

export const sendTransactionHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);
  // @ts-ignore
  const resolver = async (req, res, ctx) => {
    const {id} = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        id,
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Transaction execution error.",
        }
      }),
    );
  };

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_sendRawTransaction', resolver)),
  ];
}
