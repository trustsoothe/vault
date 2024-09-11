import React from "react";
import Stack from "@mui/material/Stack";
import { useFormContext } from "react-hook-form";
import Typography from "@mui/material/Typography";
import { PocketNetworkFee, SupportedProtocols } from "@poktscan/vault";
import { AccountInfoFromAddress } from "../../components/AccountInfo";
import VaultPasswordInput from "../../Transaction/VaultPasswordInput";
import Summary, { SummaryRowItem } from "../../components/Summary";
import { PoktTransactionFormValues } from "../BaseTransaction";
import { roundAndSeparate } from "../../../utils/ui";
import SummaryValidator from "../SummaryValidator";
import useUsdPrice from "../../hooks/useUsdPrice";
import { themeColors } from "../../theme";
import CheckInput from "../CheckInput";

interface UpgradeSummaryProps {
  addValidation?: boolean;
  fromAddress: string;
  chainId: string;
  upgradeType: PoktTransactionFormValues["upgradeType"];
  upgradeHeight?: PoktTransactionFormValues["upgradeHeight"];
  upgradeVersion?: PoktTransactionFormValues["upgradeVersion"];
  features?: Array<Omit<PoktTransactionFormValues["features"][number], "type">>;
  fee: {
    fee: PocketNetworkFee;
    fetchingFee: boolean;
  };
  memo?: string;
}

export default function UpgradeSummary({
  addValidation = true,
  fromAddress,
  upgradeType,
  upgradeVersion,
  upgradeHeight,
  chainId,
  features,
  memo,
  fee,
}: UpgradeSummaryProps) {
  const { coinSymbol } = useUsdPrice({
    protocol: SupportedProtocols.Pocket,
    chainId,
  });

  const rows: Array<SummaryRowItem> = [
    {
      type: "row",
      label: "From",
      value: (
        <AccountInfoFromAddress
          address={fromAddress}
          protocol={SupportedProtocols.Pocket}
        />
      ),
    },
    {
      type: "row",
      label: "Upgrade Type",
      value: upgradeType,
    },
  ];

  if (upgradeType === "version") {
    rows.push(
      {
        type: "row",
        label: "Version",
        value: upgradeVersion,
      },
      {
        type: "row",
        label: "Height",
        value: roundAndSeparate(Number(upgradeHeight), 0, "0"),
      }
    );
  } else if (upgradeType === "features") {
    rows.push({
      type: "row",
      label: "Features",
      containerProps: {
        sx: {
          "& > p": {
            alignSelf: "flex-start",
          },
        },
      },
      value: (
        <Stack
          width={1}
          padding={1}
          marginTop={2.5}
          marginLeft={-5.6}
          borderRadius={"8px"}
          bgcolor={themeColors.white}
          border={`1px solid ${themeColors.borderLightGray}`}
        >
          {features?.map(({ feature, height }) => (
            <Stack
              key={feature}
              spacing={0.5}
              direction={"row"}
              alignItems={"center"}
              justifyContent={"space-between"}
            >
              <Typography
                noWrap
                variant={"subtitle2"}
                flexGrow={1}
                minWidth={0}
              >
                {feature}
              </Typography>
              <Typography variant={"subtitle2"} textAlign={"right"}>
                {roundAndSeparate(Number(height), 0, "0")}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ),
    });
  }

  rows.push({
    type: "row",
    label: "Fee",
    value: `${fee.fee?.value || 0} ${coinSymbol}`,
  });

  if (memo) {
    rows.push({
      type: "row",
      label: "Memo",
      value: memo,
    });
  }

  const summaryComponent = (
    <Stack overflow={"auto"}>
      <Summary rows={rows} />
    </Stack>
  );

  if (!addValidation) {
    return summaryComponent;
  }

  return (
    <>
      <SummaryValidator fromAddress={fromAddress} chainId={chainId}>
        {summaryComponent}
      </SummaryValidator>
      <CheckInput />
      <VaultPasswordInput />
    </>
  );
}

export function UpgradeSummaryFromForm({
  addValidation = true,
}: {
  addValidation?: boolean;
}) {
  const { watch } = useFormContext<PoktTransactionFormValues>();

  const [
    chainId,
    fee,
    fromAddress,
    upgradeType,
    upgradeHeight,
    upgradeVersion,
    fetchingFee,
    features,
    memo,
  ] = watch([
    "chainId",
    "fee",
    "fromAddress",
    "upgradeType",
    "upgradeHeight",
    "upgradeVersion",
    "fetchingFee",
    "features",
    "memo",
  ]);

  return (
    <UpgradeSummary
      fromAddress={fromAddress}
      chainId={chainId}
      upgradeType={upgradeType}
      upgradeHeight={upgradeHeight}
      upgradeVersion={upgradeVersion}
      fee={{
        fee,
        fetchingFee,
      }}
      addValidation={addValidation}
      features={features?.filter((item) => item.type === "added")}
      memo={memo}
    />
  );
}
