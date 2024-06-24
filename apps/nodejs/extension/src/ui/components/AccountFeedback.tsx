import Stack from "@mui/material/Stack";
import React, { useEffect } from "react";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import {
  networkSymbolSelector,
  selectedChainByProtocolSelector,
} from "../../redux/selectors/network";
import AppToBackground from "../../controllers/communication/AppToBackground";
import { balanceMapConsideringAsset } from "../../redux/selectors/account";
import { labelByProtocolMap } from "../../constants/protocols";
import CopyAddressButton from "../Home/CopyAddressButton";
import WarningActionBanner from "./WarningActionBanner";
import SuccessActionBanner from "./SuccessActionBanner";
import useGetPrices from "../../hooks/useGetPrices";
import { useAppSelector } from "../../hooks/redux";
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
  const networkSymbol = useAppSelector(networkSymbolSelector);
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const selectedChain = selectedChainByProtocol[account.protocol];
  const balanceMap = useAppSelector(balanceMapConsideringAsset(undefined));

  const {
    data: pricesByProtocolAndChain,
    isError: isNetworkPriceError,
    isLoading: isLoadingNetworkPrices,
  } = useGetPrices({
    pollingInterval: 60000,
  });
  const usdPrice: number =
    pricesByProtocolAndChain?.[account.protocol]?.[selectedChain] || 0;

  useEffect(() => {
    AppToBackground.getAccountBalance({
      address: account.address,
      chainId: selectedChain,
      protocol: account.protocol,
    }).catch();
  }, []);

  const balance = (balanceMap?.[account.address]?.amount as number) || 0;
  const errorBalance = balanceMap?.[account.address]?.error || false;
  const loadingBalance =
    (balanceMap?.[account.address]?.loading && !balance) || false;

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
                sxProps={{
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
            value: labelByProtocolMap[account.protocol],
          },
        ]}
      />
      <Summary
        rows={[
          {
            type: "row",
            label: "Balance",
            value: loadingBalance ? (
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
                <Typography variant={"subtitle2"}>{networkSymbol}</Typography>
                {isLoadingNetworkPrices && isNetworkPriceError ? (
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
