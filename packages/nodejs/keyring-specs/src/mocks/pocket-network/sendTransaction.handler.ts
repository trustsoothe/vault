import {rest} from "msw";
import Url from 'node:url';
import urlJoin from "url-join";

export const sendTransactionHandlerFactory = (baseUrl: string) => {
  const url = new Url.URL(urlJoin(baseUrl, '/v1/client/rawtx'));
  return rest.post(url.toString(), async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        code: 2,
        logs: null,
        txhash: 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855',
        raw_log: JSON.stringify({
          codespace: 'sdk',
          code: 2,
          message: 'ERROR:\nCodespace: sdk\nCode: 2\nMessage: "txBytes are empty"\n'
        }),
      }),
    );
  });
}
