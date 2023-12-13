import Grow from "@mui/material/Grow";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Popper from "@mui/material/Popper";
import { shallowEqual } from "react-redux";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  type SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import { getTruncatedText, roundAndSeparate } from "../../utils/ui";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import CloseIcon from "../../assets/img/close_icon.svg";
import ExpandIcon from "../../assets/img/drop_down_icon.svg";
import { changeSelectedAccountOfNetwork } from "../../redux/slices/app";
import AppToBackground from "../../controllers/communication/AppToBackground";
import {
  networkSymbolSelector,
  selectedChainSelector,
  selectedProtocolSelector,
} from "../../redux/selectors/network";
import {
  accountsSelector,
  balanceMapConsideringAsset,
  selectedAccountAddressSelector,
  selectedAccountSelector,
} from "../../redux/selectors/account";

interface AccountItemProps {
  account: SerializedAccountReference & { symbol: string };
  showBorderTop?: boolean;
  closeSelector: () => void;
}

const AccountItem: React.FC<AccountItemProps> = ({
  account,
  showBorderTop,
  closeSelector,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const selectedChain = useAppSelector(selectedChainSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const selectedAccountAddress = useAppSelector(selectedAccountAddressSelector);
  const balanceMap = useAppSelector(balanceMapConsideringAsset(undefined));

  useEffect(() => {
    AppToBackground.getAccountBalance({
      address: account.address,
      chainId: selectedChain,
      protocol: selectedProtocol,
    }).catch();
  }, []);

  const { address, name } = account;

  const balance = (balanceMap?.[address]?.amount as number) || 0;
  const errorBalance = balanceMap?.[address]?.error || false;
  const loadingBalance = (balanceMap?.[address]?.loading && !balance) || false;

  const isSelected = selectedAccountAddress === address;

  const onClickItem = useCallback(() => {
    if (isSelected) {
      closeSelector();
      return;
    }

    dispatch(
      changeSelectedAccountOfNetwork({
        protocol: selectedProtocol,
        address,
      })
    ).then(() => closeSelector());
  }, [isSelected, closeSelector, selectedProtocol, address, dispatch]);

  return (
    <Stack
      height={60}
      minHeight={60}
      paddingY={0.3}
      paddingX={0.5}
      boxSizing={"border-box"}
      bgcolor={
        isSelected
          ? `${theme.customColors.primary100}!important`
          : theme.customColors.white
      }
      borderTop={
        showBorderTop ? `1px solid ${theme.customColors.dark15}` : undefined
      }
      sx={{
        cursor: "pointer",
        userSelect: "none",
        "&:hover": {
          backgroundColor: theme.customColors.dark5,
        },
      }}
      onClick={onClickItem}
    >
      <Stack
        height={24}
        direction={"row"}
        alignItems={"center"}
        justifyContent={"space-between"}
        spacing={0.5}
      >
        <Typography
          flexGrow={1}
          fontSize={12}
          fontWeight={500}
          overflow={"hidden"}
          whiteSpace={"nowrap"}
          letterSpacing={"0.5px"}
          textOverflow={"ellipsis"}
        >
          {name}
        </Typography>
        <Stack
          height={20}
          minHeight={20}
          paddingX={0.7}
          borderRadius={"12px"}
          alignItems={"center"}
          justifyContent={"center"}
          bgcolor={theme.customColors.dark5}
        >
          <Typography
            fontSize={9}
            letterSpacing={"0.5px"}
            color={theme.customColors.dark75}
            lineHeight={"20px"}
          >
            {getTruncatedText(address)}
          </Typography>
        </Stack>
      </Stack>
      <Stack height={30} justifyContent={"center"} alignItems={"flex-end"}>
        {errorBalance ? (
          <Typography>Error balance. Retry</Typography>
        ) : loadingBalance ? (
          <Skeleton variant={"rectangular"} width={100} height={20} />
        ) : (
          <Stack
            direction={"row"}
            alignItems={"center"}
            spacing={0.5}
            justifyContent={"flex-end"}
            width={158}
          >
            <Typography
              fontSize={16}
              fontWeight={500}
              textAlign={"left"}
              textOverflow={"ellipsis"}
              whiteSpace={"nowrap"}
              overflow={"hidden"}
            >
              {roundAndSeparate(
                balance,
                selectedProtocol === SupportedProtocols.Ethereum ? 18 : 6,
                "0"
              )}
            </Typography>
            <Typography
              color={theme.customColors.dark50}
              fontSize={16}
              fontWeight={500}
            >
              {account.symbol}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

interface AccountSelectProps {
  toggleShowBackdrop: () => void;
}

const AccountSelect: React.FC<AccountSelectProps> = ({
  toggleShowBackdrop,
}) => {
  const theme = useTheme();
  const accounts = useAppSelector(accountsSelector);
  const selectedProtocol = useAppSelector(selectedProtocolSelector);
  const networkSymbol = useAppSelector(networkSymbolSelector);

  const accountsOfNetwork = useMemo(() => {
    return accounts
      .filter((account) => account.protocol === selectedProtocol)
      .map((account) => ({
        ...account,
        symbol: networkSymbol || "",
      }));
  }, [accounts, networkSymbol]);

  const selectedAccount = useAppSelector(selectedAccountSelector, shallowEqual);

  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const onOpenSelector = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      setAnchorEl(event.currentTarget);
      toggleShowBackdrop();
    },
    [toggleShowBackdrop]
  );

  const onCloseSelector = useCallback(() => {
    setAnchorEl(null);
    toggleShowBackdrop();
  }, [toggleShowBackdrop]);

  if (!selectedAccount) return null;

  return (
    <>
      <Stack
        width={180}
        minWidth={180}
        maxWidth={180}
        height={36}
        boxSizing={"border-box"}
        direction={"row"}
        paddingLeft={0.5}
        alignItems={"center"}
        zIndex={anchorEl ? 3 : undefined}
        sx={{
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
          borderRadius: anchorEl ? "12px" : "18px",
          boxShadow: "0px 0px 6px 0px #1C2D4A26",
          backgroundColor: theme.customColors.white,
          borderBottom: `1.5px solid ${theme.customColors.dark25}`,

          ...(anchorEl && {
            cursor: "normal",
            boxShadow: undefined,
            borderBottom: undefined,
            borderBottomLeftRadius: "0px",
            borderBottomRightRadius: "0px",
            border: `1px solid ${theme.customColors.dark15}`,
          }),
        }}
        onClick={anchorEl ? onCloseSelector : onOpenSelector}
      >
        <Typography
          flexGrow={1}
          fontSize={13}
          fontWeight={700}
          marginLeft={0.6}
          overflow={"hidden"}
          whiteSpace={"nowrap"}
          letterSpacing={"0.5px"}
          textOverflow={"ellipsis"}
        >
          {!anchorEl ? selectedAccount?.name || "No Account" : "Select Account"}
        </Typography>
        {!anchorEl ? (
          <ExpandIcon
            style={{
              minWidth: 30,
              width: 30,
              height: 30,
            }}
          />
        ) : (
          <IconButton
            sx={{
              minWidth: 30,
              width: 30,
              height: 30,
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Stack>
      <Popper
        open={!!anchorEl}
        anchorEl={anchorEl}
        sx={{ zIndex: anchorEl ? 2 : undefined }}
      >
        <ClickAwayListener onClickAway={onCloseSelector}>
          <Grow in={!!anchorEl}>
            <Stack
              sx={{
                boxSizing: "border-box",
                bgcolor: theme.customColors.white,
                boxShadow: "0px 0px 6px 0px #1C2D4A26",
                width: 180,
                maxHeight: 250,
                border: `1px solid ${theme.customColors.dark15}`,
                borderTop: `none!important`,
                borderBottomLeftRadius: "12px",
                borderBottomRightRadius: "12px",
              }}
            >
              <Stack
                marginTop={1}
                marginBottom={0.5}
                paddingX={0.5}
                overflow={"auto"}
                boxSizing={"border-box"}
              >
                {accountsOfNetwork.map((account, index) => (
                  <AccountItem
                    key={account.id}
                    account={account}
                    showBorderTop={index !== 0}
                    closeSelector={onCloseSelector}
                  />
                ))}
              </Stack>
            </Stack>
          </Grow>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default AccountSelect;
