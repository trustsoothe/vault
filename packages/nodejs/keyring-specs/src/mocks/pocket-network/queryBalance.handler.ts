import {rest} from "msw";
import Url from 'node:url';
import urlJoin from "url-join";

export const queryBalanceHandlerFactory = (baseUrl: string) => {
  const url = new Url.URL(urlJoin(baseUrl, '/v1/query/balance'));
  return rest.post(url.toString(), async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        balance: 200,
      }),
    );
  });
}

export const queryBalanceFailureHandlerFactory = (baseUrl: string) => {
  const url = new Url.URL(urlJoin(baseUrl, '/v1/query/balance'));
  return rest.post(url.toString(), async (req, res, ctx) => {
    return res(
      ctx.status(500),
    );
  });
}
