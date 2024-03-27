import {rest} from "msw";
import Url from 'node:url';
import urlJoin from "url-join";
import {INetwork} from "@poktscan/vault";

export const queryFeeHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(urlJoin(network.rpcUrl, '/v1/query/param'));
  return [
    rest.post(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          param_key: 'auth/FeeMultipliers',
          param_value: JSON.stringify({
            fee_multiplier: null,
            default: '1'
          }),
        }),
      );
    }),
  ];
}

export const queryFeeFailureHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(urlJoin(network.rpcUrl, '/v1/query/param'));
  return [
    rest.post(url.toString(), async (req, res, ctx) => {
      return res(
        ctx.status(500),
      );
    }),
  ];
}
