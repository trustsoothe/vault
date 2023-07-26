import {rest} from "msw";
import Url from 'node:url';
import Path from 'node:path';

export const queryBalanceHandlerFactory = (baseUrl: string) => {
  const url = new Url.URL(Path.join(baseUrl, '/v1/query/balance'));
  return rest.post(url.toString(), async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        balance: 0,
      }),
    );
  });
}
