import Stack from "@mui/material/Stack";
import React, { useState } from "react";
import Button from "@mui/material/Button";
import { shallowEqual } from "react-redux";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { SupportedProtocols } from "@poktscan/vault";
import ActivityIcon from "../assets/img/activity_icon.svg";
import CopyAddressButton from "./CopyAddressButton";
import SendIcon from "../assets/img/send_icon.svg";
import SwapIcon from "../assets/img/swap_icon.svg";
import { useAppSelector } from "../../hooks/redux";
import { roundAndSeparate } from "../../utils/ui";
import { themeColors } from "../theme";
import { selectedAccountSelector } from "../../redux/selectors/account";
import { selectedChainSelector } from "../../redux/selectors/network";
import useSelectedAsset from "./hooks/useSelectedAsset";
import SendModal from "../Transaction/SendModal";
import GrayContainer from "../components/GrayContainer";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";

export default function SelectedAccount() {
  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedAsset = useSelectedAsset();
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

  const toggleShowSendModal = () => setShowSendModal((prev) => !prev);

  useDidMountEffect(() => {
    setShowSendModal(false);
  }, [selectedAccount.address]);

  return (
    <>
      <SendModal open={showSendModal} onClose={toggleShowSendModal} />
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

        <CopyAddressButton address={selectedAccount?.address} />
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
          <Button className={"send-btn"} onClick={toggleShowSendModal}>
            <span>Send</span>
            <SendIcon />
          </Button>
          {(selectedAccount?.protocol === SupportedProtocols.Pocket ||
            selectedAsset?.symbol === "WPOKT") && (
            <Button>
              <span>Swap</span>
              <SwapIcon />
            </Button>
          )}

          <Button>
            <span>Activity</span>
            <ActivityIcon />
          </Button>
        </Stack>
      </GrayContainer>
    </>
  );
}
