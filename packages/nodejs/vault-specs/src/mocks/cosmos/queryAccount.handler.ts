import {rest} from "msw";
import Url from 'node:url';
import urlJoin from "url-join";
import {INetwork} from "@poktscan/vault";
import {withCosmosMethod} from "../withCosmosMethod";

// @ts-ignore
export const queryAccountResolver = async (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({
      jsonrpc: "2.0",
      id: 117358427644,
      result: {
        response: {
          code: 0,
          log: '',
          info: '',
          index: '0',
          key: null,
          value: 'ClMKIC9jb3Ntb3MuYXV0aC52MWJldGExLkJhc2VBY2NvdW50Ei8KK3Bva3QxeDMycndtMnNrajQ5MG00a3gweWo2M3F6bDZzZHJldWw0dTJ5c2oYSQ==',
          proofOps: null,
          height: '57609',
          codespace: ''
        }
      }
    }),
  );
};

export const queryAccountHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);

  return [
    // @ts-ignore
    rest.post(url.toString(), withCosmosMethod('abci_query', queryAccountResolver, '/cosmos.auth.v1beta1.Query/Account')),
  ];
}

export const queryAccountFailureHandlerFactory = (network: INetwork) => {
  return [
    rest.post(network.rpcUrl, async (req, res, ctx) => {
      return res(
        ctx.status(500),
      );
    }),
  ];
}
