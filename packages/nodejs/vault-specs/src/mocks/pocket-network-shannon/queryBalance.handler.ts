import {rest} from "msw";
import Url from 'node:url';
import urlJoin from "url-join";
import {INetwork} from "@poktscan/vault";

export const queryBalanceHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);
  return [
      rest.post(url.toString(), async (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            jsonrpc: '2.0',
            id: 12345,
            result: {
              response: {
                code: 0,
                log: "",
                info: "",
                index: "0",
                key: null,
                value: 'ChMKBXVwb2t0Ego5OTk5OTcyOTk0EgIQAQ==',
                proofOps: null,
                height: '56593',
                codespace: ''
              }
            }
          }),
        );
      }),
  ];
}

export const queryBalanceFailureHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(urlJoin(network.rpcUrl, '/v1/query/balance'));
  return [
    rest.post(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(500),
      );
    }),
  ];
}
