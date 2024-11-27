import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { SupportedProtocols } from "@poktscan/vault";
import ActivityIcon from "../assets/img/activity_icon.svg";
import CopyAddressButton from "./CopyAddressButton";
import SendIcon from "../assets/img/send_icon.svg";
import SwapIcon from "../assets/img/swap_icon.svg";
import { useAppSelector } from "../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import { themeColors } from "../theme";
import { selectedAccountSelector } from "../../redux/selectors/account";
import { TxStatus, useLazyGetActiveMintsQuery } from "../../redux/slices/wpokt";
import { selectedChainSelector } from "../../redux/selectors/network";
import useSelectedAsset from "./hooks/useSelectedAsset";
import GrayContainer from "../components/GrayContainer";
import { ACTIVITY_PAGE } from "../../constants/routes";
import SendCoinsModal from "../Transaction/SendCoinsModal";
import useDidMountEffect from "../hooks/useDidMountEffect";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import {getAccountPrefixByProtocol} from "../../utils/accounts";

export default function SelectedAccount() {
  const navigate = useNavigate();
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedAsset = useSelectedAsset();
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const {
    balance,
    usdBalance,
    isLoadingUsdPrice,
    isLoadingBalance,
    balanceError,
    usdPriceError,
    coinSymbol,
  } = useBalanceAndUsdPrice({
    address: selectedAccount.address,
    chainId: selectedChain,
    protocol: selectedAccount.protocol,
    asset: selectedAsset,
  });

  const [fetchActiveMints, { mintTransactions }] = useLazyGetActiveMintsQuery({
    selectFromResult: ({ data }) => ({
      mintTransactions: (data || []).filter((m) => m.status === TxStatus.SIGNED)
        .length,
    }),
  });

  const mustShowMintTransactions = selectedAsset?.symbol === "WPOKT";

  useEffect(() => {
    if (mustShowMintTransactions) {
      fetchActiveMints(
        {
          recipient: selectedAccount.address,
          chain: selectedChain === "1" ? "mainnet" : "testnet",
        },
        true
      );
    }
  }, [mustShowMintTransactions, selectedAccount.address]);

  const openSendModal = () => setShowSendModal(true);
  const initSwap = () => {
    setIsSwapping(true);
    setShowSendModal(true);
  };

  const closeSendModal = () => {
    setShowSendModal(false);

    if (isSwapping) {
      setTimeout(() => setIsSwapping(false), 150);
    }
  };

  const onClickActivity = () =>
    navigate(
      `${ACTIVITY_PAGE}${selectedAsset ? `?asset=${selectedAsset.id}` : ""}`,
      {}
    );

  useDidMountEffect(() => {
    setShowSendModal(false);
  }, [selectedAccount.address]);

  return (
    <>
      <SendCoinsModal
        open={showSendModal}
        onClose={closeSendModal}
        isSwapping={isSwapping}
      />
      <GrayContainer>
        {isLoadingBalance ? (
          <Skeleton
            width={100}
            variant={"rectangular"}
            height={35}
            sx={{ minHeight: 35 }}
          />
        ) : (
          <Stack direction={"row"} alignItems={"center"} spacing={0.7}>
            <Typography variant={"h1"} noWrap={true} maxWidth={275}>
              {balanceError
                ? "-"
                : roundAndSeparate(
                    balance,
                    selectedAccount.protocol === SupportedProtocols.Ethereum
                      ? selectedAsset?.decimals || 18
                      : 6,
                    "0"
                  )}
            </Typography>
            <Typography
              variant={"h1"}
              fontWeight={300}
              color={themeColors.gray}
            >
              {coinSymbol}
            </Typography>
          </Stack>
        )}

        {isLoadingBalance || isLoadingUsdPrice ? (
          <Skeleton
            width={70}
            height={20}
            variant={"rectangular"}
            sx={{
              marginTop: 0.8,
              marginBottom: 2,
              minHeight: 20,
            }}
          />
        ) : (
          <Typography marginTop={0.8} marginBottom={2}>
            {balanceError || usdPriceError
              ? "-"
              : `$ ${roundAndSeparate(usdBalance, 2, "0.00")}`}
          </Typography>
        )}

        <CopyAddressButton
          address={selectedAccount?.address}
          prefix={getAccountPrefixByProtocol(selectedAccount?.protocol)}
        />
        <Stack
          width={1}
          spacing={1.3}
          paddingX={2.4}
          marginTop={4.6}
          direction={"row"}
          alignItems={"center"}
          boxSizing={"border-box"}
          justifyContent={"center"}
          sx={{
            "& button": {
              width: 1,
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
          <Button className={"send-btn"} onClick={openSendModal}>
            <span>Send</span>
            <SendIcon />
          </Button>
          {(selectedAccount?.protocol === SupportedProtocols.Pocket ||
            selectedAsset?.symbol === "WPOKT") && (
            <Button onClick={initSwap}>
              <span>Swap</span>
              <SwapIcon />
            </Button>
          )}

          <Button onClick={onClickActivity} sx={{ position: "relative" }}>
            <span>Activity</span>
            <ActivityIcon />
            {mintTransactions > 0 && selectedAsset?.symbol === "WPOKT" && (
              <Stack
                width={18}
                height={18}
                borderRadius={"50%"}
                alignItems={"center"}
                boxSizing={"border-box"}
                justifyContent={"center"}
                position={"absolute"}
                bgcolor={themeColors.intense_red}
                top={-9}
                right={-9}
              >
                <Typography
                  lineHeight={"14px"}
                  fontSize={11}
                  color={themeColors.white}
                >
                  {mintTransactions}
                </Typography>
              </Stack>
            )}
          </Button>
        </Stack>
      </GrayContainer>
    </>
  );
}
