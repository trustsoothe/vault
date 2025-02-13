import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { PocketNetworkFee, SupportedProtocols } from "@soothe/vault";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import Summary, { SummaryProps } from "../../components/Summary";
import { AmountWithUsd } from "../../Transaction/BaseSummary";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import ChainsSummary from "../ChainsSummary";
import {
  getAddressFromPublicKey,
  isValidAddress,
} from "../../../utils/networkOperations";
import useGetNode from "../useGetNode";
import CheckInput from "../CheckInput";

interface StakeNodeSummaryProps {
  fromAddress: string;
  chainId: string;
  outputAddress?: string;
  memo?: string;
  amount: number;
  chains: string[];
  nodeAddress?: string;
  nodePublicKey?: string;
  rewardDelegators?: Record<string, number>;
  serviceURL: string;
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
  addValidation?: boolean;
}

export default function StakeNodeSummary({
  fromAddress,
  chainId,
  amount,
  fee,
  serviceURL,
  rewardDelegators,
  nodeAddress: nodeAddressFromProps,
  chains,
  nodePublicKey,
  outputAddress,
  memo,
  addValidation = true,
}: StakeNodeSummaryProps) {
  const { coinSymbol, usdPrice, isLoading } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });

  const [nodeAddress, setNodeAddress] = useState(nodeAddressFromProps || "");

  const { node, isSuccess } = useGetNode(nodeAddress, chainId);

  useEffect(() => {
    if (nodePublicKey) {
      getAddressFromPublicKey(nodePublicKey).then(setNodeAddress);
    }
  }, [nodePublicKey]);

  const summaries: Array<SummaryProps> = [];

  const firstSummary: SummaryProps = {
    rows: [
      {
        type: "row",
        label: "Stake Amount",
        value: (
          <AmountWithUsd
            balance={amount}
            decimals={6}
            symbol={coinSymbol}
            usdBalance={amount * usdPrice}
            isLoadingUsdPrice={isLoading}
          />
        ),
        containerProps: {
          sx: {
            "& > p": {
              minWidth: 80,
            },
          },
        },
      },
      {
        type: "row",
        label: "Fee",
        value: `${fee.fee?.value || 0} ${coinSymbol}`,
      },
      {
        type: "row",
        label: "Service URL",
        value: serviceURL,
      },
      {
        type: "row",
        label: "Node Address",
        value: (
          <AccountInfoFromAddress
            address={nodeAddress}
            protocol={SupportedProtocols.Pocket}
          />
        ),
      },
    ],
  };

  if (outputAddress || fromAddress !== nodeAddress) {
    firstSummary.rows.push({
      type: "row",
      label: "Output Address",
      value: (
        <AccountInfoFromAddress
          address={outputAddress || fromAddress || nodeAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    });
  }

  summaries.push(firstSummary);

  if (rewardDelegators && Object.keys(rewardDelegators).length) {
    summaries.push(
      {
        containerProps: {
          paddingTop: 0,
          paddingBottom: 0,
          marginTop: -0.5,
        },
        rows: [
          {
            type: "row",
            label: "Reward Delegators",
            value: "",
            containerProps: {
              sx: {
                alignItems: "flex-start",
                "& h6": {
                  whiteSpace: "pre",
                },
              },
            },
          },
        ],
      },
      {
        containerProps: {
          paddingTop: 0.8,
          paddingLeft: 2.4,
          sx: {
            "& p": {
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            },
            "& h6": {
              textOverflow: "unset",
              overflow: "unset",
              whiteSpace: "unset",
            },
          },
        },
        rows:
          Object.entries(rewardDelegators).map(([key, value]) => ({
            type: "row",
            label: (
              <AccountInfoFromAddress
                address={key}
                protocol={SupportedProtocols.Pocket}
              />
            ),
            value: value + "%",
          })) || [],
      }
    );
  }

  if (memo) {
    summaries.push({
      containerProps: {
        paddingTop: 0,
        marginTop: -0.6,
      },
      rows: [
        {
          type: "row",
          label: "Memo",
          value: memo,
        },
      ],
    });
  }

  const summaryComponent = (
    <>
      {node &&
        node.output_address === fromAddress &&
        outputAddress &&
        outputAddress !== fromAddress && (
          <Typography fontSize={11} marginBottom={0.7} lineHeight={"16px"}>
            If you execute this transaction, you will lose control of the node,
            its rewards and its staked tokens.
          </Typography>
        )}
      <Stack overflow={"auto"}>
        {summaries.map((summary, index) => {
          if (index === 0) {
            return (
              <React.Fragment key={index}>
                <Summary {...summary} />
                <ChainsSummary chains={chains} chainId={chainId} />
              </React.Fragment>
            );
          }

          return <Summary {...summary} key={index} />;
        })}
      </Stack>
    </>
  );

  return !addValidation ? (
    summaryComponent
  ) : (
    <>
      <SummaryValidator
        chainId={chainId}
        fromAddress={fromAddress}
        amount={amount - Number(node?.tokens || 0) / 1e6}
        customValidation={() => {
          if (!node && !isSuccess) {
            return "Loading node...";
          }

          if (node && node.output_address !== fromAddress) {
            return "You are not allowed to stake this node";
          }

          return true;
        }}
      >
        {summaryComponent}
      </SummaryValidator>
      <CheckInput />
      <VaultPasswordInput />
    </>
  );
}

export function StakeNodeSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext();

  const [
    amount,
    chainId,
    chains,
    fee,
    fromAddress,
    nodePublicKey,
    rewardDelegators,
    serviceURL,
    fetchingFee,
    outputAddress,
    memo,
  ] = watch([
    "amount",
    "chainId",
    "chains",
    "fee",
    "fromAddress",
    "nodePublicKey",
    "rewardDelegators",
    "serviceURL",
    "fetchingFee",
    "outputAddress",
    "memo",
  ]);

  const nodeAddress = isValidAddress(nodePublicKey, SupportedProtocols.Pocket)
    ? nodePublicKey
    : undefined;

  return (
    <StakeNodeSummary
      amount={Number(amount)}
      chainId={chainId}
      chains={chains}
      fee={{
        fee,
        fetchingFee,
      }}
      fromAddress={fromAddress}
      nodeAddress={nodeAddress}
      nodePublicKey={!nodeAddress ? nodePublicKey : undefined}
      rewardDelegators={rewardDelegators
        ?.filter((item) => item.type === "added")
        .reduce((acc, item) => ({ ...acc, [item.address]: item.amount }), {})}
      serviceURL={serviceURL}
      outputAddress={outputAddress}
      memo={memo}
      addValidation={addValidation}
    />
  );
}
