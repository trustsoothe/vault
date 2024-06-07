import Stack from "@mui/material/Stack";
import React, { useEffect } from "react";
import Avatar from "@mui/material/Avatar";
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
import { getTruncatedText, roundAndSeparate } from "../../utils/ui";
import { labelByProtocolMap } from "../../constants/protocols";
import SuccessActionBanner from "./SuccessActionBanner";
import useGetPrices from "../../hooks/useGetPrices";
import { useAppSelector } from "../../hooks/redux";
import AccountInfo from "./AccountInfo";
import Summary from "./Summary";

interface AccountCreatedProps {
  account: SerializedAccountReference;
  successLabel: string;
}

export default function AccountAdded({
  account,
  successLabel,
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
    <Stack padding={2.4} spacing={1.6}>
      <SuccessActionBanner label={successLabel} />
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
            // todo: change for CopyAddressButton component
            value: getTruncatedText(account.address, 5),
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
              // todo: create component

              <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
                <Typography noWrap={true} variant={"subtitle2"}>
                  {roundAndSeparate(
                    balance,
                    account.protocol === SupportedProtocols.Ethereum ? 18 : 6,
                    "0"
                  )}
                </Typography>
                <Typography variant={"subtitle2"}>{networkSymbol}</Typography>
                {!isLoadingNetworkPrices && !isNetworkPriceError && (
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
