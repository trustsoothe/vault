import Url from "node:url";
import {rest} from "msw";
import {INetwork} from "@poktscan/keyring";
import {withMethod} from "./withMethod";

export const sendTransactionHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);
  // @ts-ignore
  const resolver = async (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({}),
    );
  };

  return [
    // @ts-ignore
    rest.post(url.toString(), withMethod('eth_sendTransaction', resolver)),
  ];
}
