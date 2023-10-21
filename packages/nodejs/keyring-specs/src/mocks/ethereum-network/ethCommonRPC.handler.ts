import {rest} from "msw";
import Url from 'node:url';

export const commonRPCHandlerFactory = (baseUrl: string) => {
  const url = new Url.URL(baseUrl);
  return rest.post(url.toString(), async (req, res, ctx) => {
    const {method, id} = await req.json();

    switch (method) {
      case 'eth_getBalance':
        return res(
          ctx.status(200),
          ctx.json({
            id,
            jsonrpc: "2.0",
            result: "0xC8", // 200 in hex
          }),
        );
      case 'eth_estimateGas':
        return res(
          ctx.status(200),
          ctx.json({
            id,
            jsonrpc: "2.0",
            result: "0x5208", // 21000 in hex
          }),
        );
      default:
        throw new Error(`Ethereum RPC method ${method} not implemented`);
    }
  });
}

export const commonRPCFailureHandlerFactory = (baseUrl: string) => {
  const url = new Url.URL(baseUrl);
  return rest.post(url.toString(), async (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({}),
    );
  });
}
