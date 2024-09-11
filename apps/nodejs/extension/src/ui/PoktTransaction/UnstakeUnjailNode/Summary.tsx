import React from "react";
import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import { PocketNetworkFee, SupportedProtocols } from "@poktscan/vault";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import Summary from "../../components/Summary";
import useGetNode from "../useGetNode";
import CheckInput from "../CheckInput";

interface UnstakeUnjailNodeSummaryProps {
  signerAddress: string;
  nodeAddress: string;
  chainId: string;
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
  addValidation?: boolean;
}

export default function UnstakeUnjailNodeSummary({
  signerAddress,
  nodeAddress,
  fee,
  chainId,
  addValidation = true,
}: UnstakeUnjailNodeSummaryProps) {
  const { coinSymbol } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });

  const { node, isSuccess } = useGetNode(nodeAddress, chainId);

  const summaryComponent = (
    <Stack overflow={"auto"}>
      <Summary
        rows={[
          {
            type: "row",
            label: "Signer",
            value: (
              <AccountInfoFromAddress
                address={signerAddress}
                protocol={SupportedProtocols.Pocket}
              />
            ),
          },
          {
            type: "row",
            label: "Node",
            value: (
              <AccountInfoFromAddress
                address={nodeAddress}
                protocol={SupportedProtocols.Pocket}
              />
            ),
          },
          {
            type: "row",
            label: "Fee",
            value: `${fee.fee?.value || 0} ${coinSymbol}`,
          },
        ]}
      />
    </Stack>
  );

  return !addValidation ? (
    summaryComponent
  ) : (
    <>
      <SummaryValidator
        fromAddress={signerAddress}
        chainId={chainId}
        customValidation={() => {
          if (!node && !isSuccess) {
            return "Loading...";
          }

          if (!node && isSuccess) {
            return "Node not found";
          }

          if (
            node &&
            node.output_address !== signerAddress &&
            node.address !== signerAddress
          ) {
            return "You are not the owner of this node";
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

export function UnstakeUnjailNodeSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext();

  const [fromAddress, nodeAddress, chainId, fee, fetchingFee] = watch([
    "fromAddress",
    "nodeAddress",
    "chainId",
    "fee",
    "fetchingFee",
  ]);

  return (
    <UnstakeUnjailNodeSummary
      signerAddress={fromAddress}
      nodeAddress={nodeAddress}
      chainId={chainId}
      fee={{
        fee,
        fetchingFee,
      }}
      addValidation={addValidation}
    />
  );
}
