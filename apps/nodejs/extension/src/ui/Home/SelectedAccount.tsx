import Stack from "@mui/material/Stack";
import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@poktscan/vault";
import ActivityIcon from "../assets/img/activity_icon.svg";
import AppToBackground from "../../controllers/communication/AppToBackground";
import CopyAddressButton from "./CopyAddressButton";
import useGetPrices from "../../hooks/useGetPrices";
import SendIcon from "../assets/img/send_icon.svg";
import SwapIcon from "../assets/img/swap_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import { themeColors } from "../theme";
import {
  balanceMapConsideringAsset,
  selectedAccountSelector,
} from "../../redux/selectors/account";
import {
  networkSymbolSelector,
  selectedChainSelector,
} from "../../redux/selectors/network";

export default function SelectedAccount() {
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const selectedChain = useAppSelector(selectedChainSelector);
  const balanceMap = useAppSelector(balanceMapConsideringAsset(undefined));
  const networkSymbol = useAppSelector(networkSymbolSelector);

  useEffect(() => {
    AppToBackground.getAccountBalance({
      address: selectedAccount.address,
      protocol: selectedAccount.protocol,
      chainId: selectedChain,
    });

    const interval = setInterval(() => {
      AppToBackground.getAccountBalance({
        address: selectedAccount.address,
        protocol: selectedAccount.protocol,
        chainId: selectedChain,
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedChain, selectedAccount.address, selectedAccount.protocol]);

  const {
    data: pricesByProtocolAndChain,
    isError: isNetworkPriceError,
    isLoading: isLoadingNetworkPrices,
    refetch: refetchNetworkPrices,
  } = useGetPrices({
    pollingInterval: 60000,
  });
  const usdPrice: number =
    pricesByProtocolAndChain?.[selectedAccount.protocol]?.[selectedChain] || 0;

  const balance =
    (balanceMap?.[selectedAccount.address]?.amount as number) || 0;
  const errorBalance = balanceMap?.[selectedAccount.address]?.error || false;
  const loadingBalance =
    (balanceMap?.[selectedAccount.address]?.loading && !balance) || false;

  return (
    <Stack
      width={1}
      height={250}
      paddingTop={4}
      alignItems={"center"}
      boxSizing={"border-box"}
      boxShadow={"0 1px 0 0 #eff1f4"}
      borderBottom={`1px solid ${themeColors.borderLightGray}`}
    >
      {loadingBalance ? (
        <Skeleton width={150} variant={"rectangular"} height={35} />
      ) : (
        <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
          <Typography variant={"h1"} noWrap={true} maxWidth={275}>
            {roundAndSeparate(
              balance,
              selectedAccount.protocol === SupportedProtocols.Ethereum ? 18 : 6,
              "0"
            )}
          </Typography>
          <Typography variant={"h1"} color={themeColors.gray} fontWeight={300}>
            {networkSymbol}
          </Typography>
        </Stack>
      )}

      {isLoadingNetworkPrices || loadingBalance ? (
        <Skeleton
          width={70}
          height={20}
          variant={"rectangular"}
          sx={{
            marginTop: 0.8,
            marginBottom: 2,
          }}
        />
      ) : (
        <Typography marginTop={0.8} marginBottom={2}>
          $ {roundAndSeparate(balance * usdPrice, 2, "0.00")}
        </Typography>
      )}

      <CopyAddressButton address={selectedAccount?.address} />
      <Stack
        width={1}
        spacing={1.3}
        marginTop={4.6}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"center"}
        sx={{
          "& button": {
            width: 102,
            height: 37,
            paddingLeft: 1.3,
            paddingRight: 1.1,
            justifyContent: "space-between",
            backgroundColor: themeColors.white,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
            "&:not(.send-btn)": {
              color: themeColors.black,
            },
          },
        }}
      >
        <Button className={"send-btn"}>
          <span>Send</span>
          <SendIcon />
        </Button>
        <Button>
          <span>Swap</span>
          <SwapIcon />
        </Button>
        <Button>
          <span>Activity</span>
          <ActivityIcon />
        </Button>
      </Stack>
    </Stack>
  );
}
