import {rest} from "msw";
import Url from 'node:url';
import urlJoin from "url-join";
import {INetwork} from "@poktscan/vault";
import {withCosmosMethod} from "../withCosmosMethod";

// @ts-ignore
export const queryStatusResolver = async (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({
      jsonrpc: "2.0",
      id: 12345,
      result: {
        node_info: {
          protocol_version: {
            p2p: "8",
            block: "11",
            app: "0"
          },
          id: 'f666eaf64b4ff99364a759df2584a3630f5dd6bb',
          listen_addr: "0.0.0.0:26656",
          network: "poktroll",
          version: "0.38.10",
          channels: "402021222330386061",
          moniker: "sequencer1",
          other: {
            tx_index: "on",
            rpc_address: "tcp://0.0.0.0:26657"
          }
        },
        sync_info: {
          latest_block_hash: "DB1AADF183C52172E8ABC61F65715BA7778C5DB88207F938C6D0F6F4565ECA72",
          latest_app_hash: "7AB5B72A8A5EE1CBB9CDA930521D47C24C8C1F5A2FBC06ABDFA2819A25CEA133",
          latest_block_height: "57609",
          latest_block_time: "2024-11-15T15:49:12.521524854Z",
          earliest_block_hash: "EA08B0A8DEEE94C02722AF30203659CB5FAAC4FDAE8EC61A55F452AE02C26FE3",
          earliest_app_hash: "E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855",
          earliest_block_height: "1",
          earliest_block_time: "2024-09-25T16:25:11.650762Z",
          catching_up: false
        },
        validator_info: {
          address: "0412B243A715A27BB54D2D05BA364579EEBAF6EF",
          pub_key: {
            type: "tendermint/PubKeyEd25519",
            value: "ISTiTdruw1gT1v/W5pUndMBSFNsU4/gF6oW4/mC6l+8="
          },
          voting_power: "900"
        }
      }
    }),
  );
};

export const queryStatusHandlerFactory = (network: INetwork) => {
  const url = new Url.URL(network.rpcUrl);

  return [
      // @ts-ignore
      rest.post(url.toString(), withCosmosMethod('status', queryStatusResolver)),
  ];
}

export const queryStatusFailureHandlerFactory = (network: INetwork) => {
  // @ts-ignore
  const queryStatusFailedResolver = async (req, res, ctx) => {
    return res(
      ctx.status(500),
    );
  };

  return [
    // @ts-ignore
    rest.post(network.rpcUrl.toString(), withCosmosMethod('status', queryStatusFailedResolver)),
  ];
}
