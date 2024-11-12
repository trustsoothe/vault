import Url from "node:url";
import {rest} from "msw";
import {withMethod} from "../withMethod";
import {INetwork, SUGGESTED_GAS_FEES_URL} from "@poktscan/vault";

export const queryFeeHandlerFactory = (network: INetwork) => {
  const suggestedGasFeesUrl = SUGGESTED_GAS_FEES_URL.replace(':chainid', network.chainID);

  // @ts-ignore
  const suggestedGasFeesResolver = (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        low: {
          suggestedMaxPriorityFeePerGas: '1',
          suggestedMaxFeePerGas: '1.000000444',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 30000
        },
        medium: {
          suggestedMaxPriorityFeePerGas: '1.5',
          suggestedMaxFeePerGas: '1.5000006',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 45000
        },
        high: {
          suggestedMaxPriorityFeePerGas: '2',
          suggestedMaxFeePerGas: '2.000000755',
          minWaitTimeEstimate: 15000,
          maxWaitTimeEstimate: 60000
        },
        estimatedBaseFee: '0.000000444',
        networkCongestion: 0.26,
        latestPriorityFeeRange: [ '0.00001', '5.000009993' ],
        historicalPriorityFeeRange: [ '0.000009908', '222.851293788' ],
        historicalBaseFeeRange: [ '0.000000419', '0.000003662' ],
        priorityFeeTrend: 'up',
        baseFeeTrend: 'down'
      }),
    );
  };

  return [
    rest.get(suggestedGasFeesUrl, suggestedGasFeesResolver),
  ];
}

export const queryFeeFailureHandlerFactory = (network: INetwork) => {
  const url = SUGGESTED_GAS_FEES_URL.replace(':chainid', network.chainID);

  // @ts-ignore
  const resolver = (req, res, ctx) => {
    return res(
      ctx.status(400),
      ctx.json({
        "statusCode": 400,
        "message":`${network.chainID} is not a supported chain id.`
      }),
    );
  };

  return [
    // @ts-ignore
    rest.get(url.toString(), resolver),
  ];
}
