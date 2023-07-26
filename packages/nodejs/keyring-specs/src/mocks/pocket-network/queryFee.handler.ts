import {rest} from "msw";
import Url from 'node:url';
import Path from 'node:path';

export const queryFeeHandlerFactory = (baseUrl: string) => {
  const url = new Url.URL(Path.join(baseUrl, '/v1/query/param'));
  return rest.post(url.toString(), async (req, res, ctx) => {
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
  });
}
