import React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import { selectedChainByProtocolSelector } from "../../redux/selectors/network";
import { getTruncatedText, roundAndSeparate } from "../../utils/ui";
import useBalanceAndUsdPrice from "../hooks/useBalanceAndUsdPrice";
import SelectedIcon from "../assets/img/check_icon.svg";
import { useAppSelector } from "../hooks/redux";
import AvatarByString from "./AvatarByString";
import { themeColors } from "../theme";

interface AccountSelectableItemProps {
  isSelected: boolean;
  onClickAccount: (account: SerializedAccountReference) => void;
  account: SerializedAccountReference;
  disabled?: boolean;
}

export default function AccountSelectableItem({
  account,
  onClickAccount,
  isSelected,
  disabled,
}: AccountSelectableItemProps) {
  const selectedChainByProtocol = useAppSelector(
    selectedChainByProtocolSelector
  );
  const selectedChain = selectedChainByProtocol[account.protocol];

  const {
    balance,
    usdBalance,
    isLoadingUsdPrice,
    isLoadingBalance,
    balanceError,
    usdPriceError,
    coinSymbol,
  } = useBalanceAndUsdPrice({
    address: account.address,
    chainId: selectedChain,
    protocol: account.protocol,
    nameOnError: account.name,
    interval: 0,
  });

  return (
    <Button
      key={account.address}
      sx={{
        height: 55,
        paddingY: 1,
        paddingX: 1.5,
        fontWeight: 400,
        borderRadius: "8px",
        backgroundColor: isSelected
          ? themeColors.bgLightGray
          : themeColors.white,
      }}
      disabled={disabled}
      onClick={() => onClickAccount(account)}
    >
      <Stack width={1} spacing={1.2} direction={"row"} alignItems={"center"}>
        <AvatarByString string={account.address} />
        <Stack
          spacing={0.4}
          width={"calc(100% - 30px - 27px)"}
          marginRight={"5px!important"}
        >
          <Stack
            width={1}
            spacing={0.5}
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              variant={"subtitle2"}
              lineHeight={"16px"}
              noWrap={true}
              color={themeColors.black}
            >
              {account.name}
            </Typography>
            {isLoadingBalance ? (
              <Skeleton variant={"rectangular"} width={75} height={16} />
            ) : (
              <Stack direction={"row"} alignItems={"center"} spacing={0.5}>
                <Typography
                  width={1}
                  noWrap={true}
                  maxWidth={100}
                  lineHeight={"16px"}
                  textAlign={"right"}
                  variant={"subtitle2"}
                  color={themeColors.black}
                >
                  {balanceError
                    ? "-"
                    : roundAndSeparate(
                        balance,
                        account.protocol === SupportedProtocols.Ethereum
                          ? 18
                          : 6,
                        "0"
                      )}
                </Typography>
                <Typography
                  variant={"subtitle2"}
                  lineHeight={"16px"}
                  color={themeColors.black}
                >
                  {coinSymbol}
                </Typography>
              </Stack>
            )}
          </Stack>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Typography
              variant={"body2"}
              lineHeight={"14px"}
              color={themeColors.textSecondary}
            >
              {getTruncatedText(account.address, 5)}
            </Typography>
            {isLoadingUsdPrice ? (
              <Skeleton variant={"rectangular"} width={50} height={14} />
            ) : (
              <Typography
                variant={"body2"}
                lineHeight={"14px"}
                color={themeColors.textSecondary}
              >
                ${" "}
                {usdPriceError ? "-" : roundAndSeparate(usdBalance, 2, "0.00")}
              </Typography>
            )}
          </Stack>
        </Stack>
        {isSelected && <SelectedIcon />}
      </Stack>
    </Button>
  );
}
