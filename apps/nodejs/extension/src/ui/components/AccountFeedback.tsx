import React from "react";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import { selectedChainByProtocolSelector } from "../../redux/selectors/network";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import {labelByAddressPrefixMap, labelByProtocolMap} from "../../constants/protocols";
import CopyAddressButton from "../Home/CopyAddressButton";
import WarningActionBanner from "./WarningActionBanner";
import SuccessActionBanner from "./SuccessActionBanner";
import { useAppSelector } from "../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import AccountInfo from "./AccountInfo";
import { themeColors } from "../theme";
import Summary from "./Summary";

interface AccountCreatedProps {
  account: SerializedAccountReference;
  label: React.ReactNode;
  type?: "success" | "warning";
}

export default function AccountFeedback({
  account,
  label,
  type = "success",
}: AccountCreatedProps) {
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const selectedChain = selectedChainByProtocol[account.protocol];

  const { usdPrice, isLoadingUsdPrice, isLoadingBalance, balance, coinSymbol } =
    useBalanceAndUsdPrice({
      address: account.address,
      protocol: account.protocol,
      chainId: selectedChain,
      interval: 0,
    });

  return (
    <Stack
      padding={2.4}
      spacing={1.6}
      sx={{
        svg: {
          width: 17,
          minWidth: 17,
          height: 17,
          minHeight: 17,
        },
      }}
    >
      {type === "success" ? (
        <SuccessActionBanner label={label} />
      ) : (
        <WarningActionBanner label={label} />
      )}
      <Summary
        rows={[
          {
            type: "row",
            label: "Name",
            value: (
              <AccountInfo address={account.address} name={account.name} />
            ),
          },
          {
            type: "row",
            label: "Address",
            value: (
              <CopyAddressButton
                address={account.address}
                prefix={account.prefix}
                sxProps={{
                  fontWeight: 500,
                  boxShadow: "none",
                  marginRight: -0.8,
                  color: themeColors.black,
                  backgroundColor: "transparent",
                }}
              />
            ),
          },
          {
            type: "row",
            label: "Protocol",
            value: labelByProtocolMap[account.protocol] || labelByAddressPrefixMap[account.prefix],
          },
        ]}
      />
      <Summary
        rows={[
          {
            type: "row",
            label: "Balance",
            value: isLoadingBalance ? (
              <Skeleton variant={"rectangular"} width={100} height={20} />
            ) : (
              <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
                <Typography noWrap={true} variant={"subtitle2"}>
                  {roundAndSeparate(
                    balance,
                    account.protocol === SupportedProtocols.Ethereum ? 18 : 6,
                    "0"
                  )}
                </Typography>
                <Typography variant={"subtitle2"}>{coinSymbol}</Typography>
                {isLoadingUsdPrice || isLoadingBalance ? (
                  <Skeleton variant={"rectangular"} width={48} height={20} />
                ) : (
                  <Typography>
                    ($ {roundAndSeparate(balance * usdPrice, 2, "0.00")})
                  </Typography>
                )}
              </Stack>
            ),
          },
        ]}
      />
    </Stack>
  );
}
