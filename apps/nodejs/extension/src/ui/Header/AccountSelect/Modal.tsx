import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import React, { useEffect, useMemo } from "react";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Account,
  AccountType,
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/vault";
import BaseDialog from "../../components/BaseDialog";
import {
  accountsSelector,
  balanceMapConsideringAsset,
  selectedAccountAddressSelector,
} from "../../../redux/selectors/account";
import { themeColors } from "../../theme";
import AddAccountButton from "./AddAccountButton";
import useGetPrices from "../../../hooks/useGetPrices";
import SelectedIcon from "../../assets/img/check_icon.svg";
import { useAppDispatch, useAppSelector } from "../../../hooks/redux";
import { getTruncatedText, roundAndSeparate } from "../../../utils/ui";
import {
  networkSymbolSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../../redux/selectors/network";
import AvatarByString from "../../components/AvatarByString";
import { changeSelectedAccountOfNetwork } from "../../../redux/slices/app";
import AppToBackground from "../../../controllers/communication/AppToBackground";

interface AccountItemProps {
  account: SerializedAccountReference;
  handleSelectAccount: (account: SerializedAccountReference) => void;
}

function AccountItem({ account, handleSelectAccount }: AccountItemProps) {
  const selectedChain = useAppSelector(selectedChainSelector);
  const networkSymbol = useAppSelector(networkSymbolSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const balanceMap = useAppSelector(balanceMapConsideringAsset(undefined));

  const {
    data: pricesByProtocolAndChain,
    isError: isNetworkPriceError,
    isLoading: isLoadingNetworkPrices,
    refetch: refetchNetworkPrices,
  } = useGetPrices({
    pollingInterval: 60000,
  });
  const usdPrice: number =
    pricesByProtocolAndChain?.[selectedProtocol]?.[selectedChain] || 0;

  useEffect(() => {
    AppToBackground.getAccountBalance({
      address: account.address,
      chainId: selectedChain,
      protocol: selectedProtocol,
    }).catch();
  }, []);

  const isSelected = selectedAccountAddress === account.address;

  const balance = (balanceMap?.[account.address]?.amount as number) || 0;
  const errorBalance = balanceMap?.[account.address]?.error || false;
  const loadingBalance =
    (balanceMap?.[account.address]?.loading && !balance) || false;

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
      onClick={() => handleSelectAccount(account)}
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
            {loadingBalance ? (
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
                  {roundAndSeparate(
                    balance,
                    selectedProtocol === SupportedProtocols.Ethereum ? 18 : 6,
                    "0"
                  )}
                </Typography>
                <Typography
                  variant={"subtitle2"}
                  lineHeight={"16px"}
                  color={themeColors.black}
                >
                  {networkSymbol}
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
            {isLoadingNetworkPrices || loadingBalance ? (
              <Skeleton variant={"rectangular"} width={50} height={14} />
            ) : (
              <Typography
                variant={"body2"}
                lineHeight={"14px"}
                color={themeColors.textSecondary}
              >
                $ {roundAndSeparate(balance * usdPrice, 2, "0.00")}
              </Typography>
            )}
          </Stack>
        </Stack>
        {isSelected && <SelectedIcon />}
      </Stack>
    </Button>
  );
}

interface AccountSelectModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountSelectModal({
  open,
  onClose,
}: AccountSelectModalProps) {
  const dispatch = useAppDispatch();
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectableAccounts = useMemo(() => {
    return accounts.filter(
      (account: Account) =>
        account.accountType !== AccountType.HDSeed &&
        account.protocol === selectedProtocol
    );
  }, [accounts, selectedProtocol]);

  const handleSelectAccount = (account: SerializedAccountReference) => {
    // todo: add snackbar when error occur
    dispatch(
      changeSelectedAccountOfNetwork({
        protocol: selectedProtocol,
        address: account.address,
      })
    );

    onClose();
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={"Select Account"}
      TransitionProps={{
        timeout: { exit: 300 },
      }}
    >
      <DialogContent
        sx={{
          rowGap: 0.2,
          maxHeight: 246,
          display: "flex",
          flexDirection: "column",
          paddingX: "8px!important",
          paddingY: "16px!important",
          backgroundColor: themeColors.white,
        }}
      >
        {selectableAccounts.map((account) => (
          <AccountItem
            key={account.address}
            account={account}
            handleSelectAccount={handleSelectAccount}
          />
        ))}
      </DialogContent>
      <DialogActions
        sx={{
          width: 1,
          rowGap: 2,
          padding: 2.4,
          display: "flex",
          boxSizing: "border-box",
          backgroundColor: themeColors.bgLightGray,
          borderTop: `1px solid ${themeColors.borderLightGray}`,
        }}
      >
        <AddAccountButton closeSelectModal={onClose} />
      </DialogActions>
    </BaseDialog>
  );
}
