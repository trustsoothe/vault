import type { ChainID } from "@poktscan/keyring/dist/lib/core/common/protocols/ChainID";
import type { RootState } from "../../redux/store";
import { connect } from "react-redux";
import Grow from "@mui/material/Grow";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material";
import Popper from "@mui/material/Popper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { ClickAwayListener } from "@mui/base/ClickAwayListener";
import React, { useCallback, useEffect, useState } from "react";
import {
  type SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import { roundAndSeparate } from "../../utils/ui";
import { useAppDispatch } from "../../hooks/redux";
import CloseIcon from "../../assets/img/close_icon.svg";
import ExpandIcon from "../../assets/img/drop_down_icon.svg";
import { changeSelectedAccountOfNetwork } from "../../redux/slices/app";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface AccountItemProps {
  account: SerializedAccountReference;
  showBorderTop?: boolean;
  closeSelector: () => void;
  balanceMap: RootState["app"]["accountBalances"][SupportedProtocols.Ethereum]["1"];
  selectedNetwork: RootState["app"]["selectedNetwork"];
  selectedChain: ChainID<RootState["app"]["selectedNetwork"]>;
  selectedAccountId: string;
}

const AccountItemComponent: React.FC<AccountItemProps> = ({
  account,
  showBorderTop,
  closeSelector,
  balanceMap,
  selectedNetwork,
  selectedChain,
  selectedAccountId,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    AppToBackground.getAccountBalance({
      address: account.address,
      chainId: selectedChain,
      protocol: selectedNetwork,
    }).catch();
  }, []);

  const { address, name, id, asset } = account;

  const balance = (balanceMap[address]?.amount as number) || 0;
  const errorBalance = balanceMap[address]?.error || false;
  const loadingBalance = balanceMap[address]?.loading || false;

  const addressFirstCharacters = address.substring(0, 4);
  const addressLastCharacters = address.substring(address.length - 4);

  const isSelected = selectedAccountId === id;

  const onClickItem = useCallback(() => {
    if (isSelected) {
      closeSelector();
      return;
    }

    dispatch(
      changeSelectedAccountOfNetwork({
        network: selectedNetwork,
        accountId: id,
      })
    ).then(() => closeSelector());
  }, [isSelected, closeSelector, selectedNetwork, id, dispatch]);

  return (
    <Stack
      height={60}
      minHeight={60}
      paddingY={0.3}
      paddingX={0.5}
      boxSizing={"border-box"}
      bgcolor={
        isSelected ? theme.customColors.primary100 : theme.customColors.white
      }
      borderTop={
        showBorderTop ? `1px solid ${theme.customColors.dark15}` : undefined
      }
      sx={{
        cursor: "pointer",
        userSelect: "none",
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
            {addressFirstCharacters}...{addressLastCharacters}
          </Typography>
        </Stack>
      </Stack>
      <Stack height={30} justifyContent={"center"} alignItems={"flex-end"}>
        {errorBalance ? (
          <Typography>Error balance. Retry</Typography>
        ) : loadingBalance ? (
          <Skeleton variant={"rectangular"} width={100} height={20} />
        ) : (
          <Typography fontSize={18} fontWeight={500} textAlign={"left"}>
            {roundAndSeparate(balance, 2, "0")}
            <span style={{ color: theme.customColors.dark50, marginLeft: 5 }}>
              {asset?.symbol}
            </span>
          </Typography>
        )}
      </Stack>
    </Stack>
  );
};

const mapStateToPropsItem = (state: RootState) => {
  const selectedNetwork = state.app.selectedNetwork;
  const selectedChain = state.app.selectedChainByNetwork[selectedNetwork];

  return {
    selectedNetwork,
    selectedChain,
    balanceMap: state.app.accountBalances[selectedNetwork][selectedChain],
    selectedAccountId: state.app.selectedAccountByNetwork[selectedNetwork],
  };
};

const AccountItemWrapper = connect(mapStateToPropsItem)(AccountItemComponent);

interface AccountSelectProps {
  accounts: RootState["vault"]["entities"]["accounts"]["list"];
  selectedNetwork: RootState["app"]["selectedNetwork"];
  selectedAccountByNetwork: RootState["app"]["selectedAccountByNetwork"];
  toggleShowBackdrop: () => void;
}

const AccountSelect: React.FC<AccountSelectProps> = ({
  accounts,
  selectedAccountByNetwork,
  selectedNetwork,
  toggleShowBackdrop,
}) => {
  const theme = useTheme();

  const accountsOfNetwork = accounts.filter(
    (account) => account.asset?.protocol === selectedNetwork
  );

  const selectedAccount = accountsOfNetwork.find(
    (account) => account.id === selectedAccountByNetwork[selectedNetwork]
  );

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
          <ExpandIcon />
        ) : (
          <IconButton>
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
                  <AccountItemWrapper
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

const mapStateToProps = (state: RootState) => ({
  accounts: state.vault.entities.accounts.list,
  selectedNetwork: state.app.selectedNetwork,
  selectedAccountByNetwork: state.app.selectedAccountByNetwork,
});

export default connect(mapStateToProps)(AccountSelect);
