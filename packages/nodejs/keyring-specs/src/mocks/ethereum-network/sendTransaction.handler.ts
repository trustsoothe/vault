import Url from "node:url";
import {rest} from "msw";
import {INetwork} from "@poktscan/keyring";

export const sendTransactionHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);
  // @ts-ignore
  const resolver = async (req, res, ctx) => {
    const {method} = await req.json();

    switch (method) {
      default:
        throw new Error(`Ethereum RPC method ${method} not implemented`);
    }
  };

  return [
    rest.post(url.toString(), resolver),
  ];
}
