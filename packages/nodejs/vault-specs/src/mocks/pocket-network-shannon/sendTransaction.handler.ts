import {rest} from "msw";
import Url from 'node:url';
import urlJoin from "url-join";
import {INetwork} from "@poktscan/vault";

export const sendTransactionHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);
  return [
    rest.post(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          jsonrpc: "2.0",
          id: 476496532578,
          result: {
            code: 18,
            data: "",
            log: 'must contain at least one message: invalid request',
            codespace: 'sdk',
            hash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'
          }
        }),
      );
    }),
  ];
}
