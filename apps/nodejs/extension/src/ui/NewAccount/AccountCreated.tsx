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
import SuccessIcon from "../assets/img/success_icon.svg";
import useGetPrices from "../../hooks/useGetPrices";
import { useAppSelector } from "../../hooks/redux";
import Summary from "../components/Summary";
import { themeColors } from "../theme";

interface AccountCreatedProps {
  account: SerializedAccountReference;
}

export default function AccountCreated({ account }: AccountCreatedProps) {
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
      <Stack
        height={40}
        spacing={1}
        paddingX={1.4}
        paddingY={1.2}
        alignItems={"center"}
        borderRadius={"8px"}
        boxSizing={"border-box"}
        bgcolor={themeColors.successLight}
        direction={"row"}
      >
        <SuccessIcon />
        <Typography variant={"subtitle2"}>Account Created</Typography>
      </Stack>
      <Summary
        rows={[
          {
            label: "Name",
            value: (
              <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
                {/*todo: change for account img*/}
                <Avatar sx={{ height: 15, width: 15 }} />
                <Typography variant={"subtitle2"}>{account.name}</Typography>
              </Stack>
            ),
          },
          {
            label: "Address",
            // todo: change for CopyAddressButton component
            value: getTruncatedText(account.address, 5),
          },
          {
            label: "Protocol",
            value: labelByProtocolMap[account.protocol],
          },
        ]}
      />
      <Summary
        rows={[
          {
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
