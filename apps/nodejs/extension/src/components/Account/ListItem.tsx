import type { RootState } from "../../redux/store";
import type { AccountWithBalance } from "../../types";
import { connect } from "react-redux";
import { useTheme } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import Stack, { StackProps } from "@mui/material/Stack";
import React, { useCallback, useMemo, useState } from "react";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import {
  SerializedAccountReference,
  SupportedProtocols,
} from "@poktscan/keyring";
import { labelByProtocolMap } from "../../constants/protocols";
import CopyIcon from "../../assets/img/copy_icon.svg";
import KeyIcon from "../../assets/img/key_icon.svg";
import EditIcon from "../../assets/img/edit_icon.svg";
import RemoveIcon from "../../assets/img/remove_icon.svg";
import ExploreIcon from "../../assets/img/explore_icon.svg";
import TransferIcon from "../../assets/img/transfer_icon.svg";
import ReimportIcon from "../../assets/img/reimport_icon.svg";
import {
  ACCOUNT_PK_PAGE,
  IMPORT_ACCOUNT_PAGE,
  REMOVE_ACCOUNT_PAGE,
  TRANSFER_PAGE,
} from "../../constants/routes";
import { roundAndSeparate } from "../../utils/ui";
import ExpandIcon from "../../assets/img/drop_down_icon.svg";
import AppToBackground from "../../controllers/communication/AppToBackground";

interface ListAccountItemProps {
  account: AccountWithBalance;
  isLoadingTokens?: boolean;
  containerProps?: StackProps;
  compact?: boolean;
  selectedChainByNetwork: RootState["app"]["selectedChainByNetwork"];
  balanceInfoMap: RootState["vault"]["entities"]["accounts"]["balances"]["byId"];
  onClickRename: (account: SerializedAccountReference) => void;
}

interface RowProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftProps?: TypographyProps;
}

export const Row: React.FC<RowProps> = ({ left, right, leftProps }) => {
  const theme = useTheme();

  return (
    <Stack
      direction={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      height={20}
    >
      {typeof left === "string" ? (
        <Typography
          fontSize={12}
          color={theme.customColors.dark50}
          letterSpacing={"0.5px"}
          {...leftProps}
        >
          {left}
        </Typography>
      ) : (
        left
      )}
      {typeof right === "string" ? (
        <Typography
          fontSize={12}
          fontWeight={500}
          color={theme.customColors.dark100}
          letterSpacing={"0.5px"}
        >
          {right}
        </Typography>
      ) : (
        right
      )}
    </Stack>
  );
};

interface ButtonActionProps {
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
}

const ButtonAction: React.FC<ButtonActionProps> = ({
  label,
  icon: Icon,
  onClick,
}) => {
  const theme = useTheme();
  return (
    <Stack
      width={60}
      height={50}
      paddingTop={0.5}
      onClick={onClick}
      alignItems={"center"}
      sx={{ cursor: "pointer", userSelect: "none" }}
    >
      <Icon />
      <Typography
        fontSize={"9px!important"}
        height={16}
        lineHeight={"16px"}
        color={theme.customColors.dark75}
        letterSpacing={"0.5px"}
      >
        {label}
      </Typography>
    </Stack>
  );
};

const ListAccountItem: React.FC<ListAccountItemProps> = ({
  account,
  isLoadingTokens,
  containerProps,
  compact = false,
  balanceInfoMap,
  onClickRename,
  selectedChainByNetwork,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const error = balanceInfoMap?.[account?.id]?.error || false;
  const loadingBalance =
    isLoadingTokens || balanceInfoMap?.[account?.id]?.loading || false;

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prevState) => !prevState);
  }, []);

  const onClickTransfer = useCallback(() => {
    navigate(
      `${TRANSFER_PAGE}?fromAddress=${account.address}&protocol=${
        account.asset.protocol
      }&chainID=${selectedChainByNetwork[account.asset.protocol]}`
    );
  }, [navigate, account, selectedChainByNetwork]);

  const onClickRemove = useCallback(() => {
    navigate(`${REMOVE_ACCOUNT_PAGE}?id=${account.id}`);
  }, [navigate, account.id]);

  const onClickReimport = useCallback(() => {
    navigate(`${IMPORT_ACCOUNT_PAGE}?reimport=${account.id}`);
  }, [account.id, navigate]);

  const onClickPrivateKey = useCallback(() => {
    navigate(`${ACCOUNT_PK_PAGE}?id=${account.id}`);
  }, [account.id, navigate]);

  const onClickExplorer = useCallback(() => {
    let link: string;
    if (account) {
      const protocol = account.asset.protocol;
      const chainID = selectedChainByNetwork[protocol];

      if (protocol === SupportedProtocols.Pocket) {
        link = `https://poktscan.com${
          chainID === "testnet" ? "/testnet" : ""
        }/account/${account.address}`;
      }
    }

    if (link) {
      window.open(link, "_blank");
    }
  }, [account, selectedChainByNetwork]);

  const handleCopyAddress = useCallback(() => {
    navigator.clipboard.writeText(account.address).then(() => {
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 500);
    });
  }, [account.address]);

  const onClickRetry = useCallback(() => {
    AppToBackground.getAccountBalance({
      address: account.address,
      protocol: account.asset.protocol,
      chainId: selectedChainByNetwork[account.asset.protocol] as any,
    }).catch();
  }, [account, selectedChainByNetwork]);

  const symbol = useMemo(() => {
    if (account) {
      return account.asset.symbol;
    }
  }, [account]);

  const balanceComponent = useMemo(() => {
    if (loadingBalance) {
      return <Skeleton width={75} height={15} variant={"rectangular"} />;
    }

    if (error) {
      return (
        <Stack
          direction={"row"}
          sx={{
            "*": {
              color: theme.customColors.red100,
              fontSize: "12px!important",
            },
          }}
          spacing={0.3}
        >
          <Typography>Error loading balance.</Typography>
          <Typography
            fontWeight={600}
            sx={{
              textDecoration: "underline",
              cursor: "pointer",
            }}
            onClick={onClickRetry}
          >
            Retry
          </Typography>
        </Stack>
      );
    }

    return roundAndSeparate(account?.balance, 2, "0");
  }, [error, loadingBalance, account, theme, onClickRetry]);

  return (
    <Stack
      width={1}
      border={`1px solid ${theme.customColors.dark25}`}
      borderRadius={"4px"}
      height={compact ? (collapsed ? 40 : 150) : 215}
      minHeight={compact ? (collapsed ? 40 : 150) : 215}
      boxSizing={"border-box"}
      {...containerProps}
      sx={{
        transition: "height 0.1s",
        ...containerProps?.sx,
      }}
    >
      <Stack
        direction={"row"}
        width={1}
        alignItems={"center"}
        height={40}
        minHeight={40}
        boxSizing={"border-box"}
        borderBottom={
          compact && collapsed
            ? undefined
            : `1px solid ${theme.customColors.dark15}`
        }
        justifyContent={compact ? "space-between" : "flex-start"}
        pb={compact && collapsed ? 0.1 : 0}
      >
        {!compact && (
          <IconButton onClick={() => onClickRename(account)}>
            <EditIcon />
          </IconButton>
        )}
        <Typography
          color={theme.customColors.dark100}
          fontSize={14}
          letterSpacing={"0.5px"}
          fontWeight={700}
          textOverflow={"ellipsis"}
          whiteSpace={"nowrap"}
          overflow={"hidden"}
          marginLeft={compact ? 1 : 0}
        >
          {account.name}
        </Typography>
        {compact && (
          <IconButton
            sx={{
              marginRight: 0.5,
              transition: "transform 0.1s",
              transform: collapsed ? "rotate(180deg)" : undefined,
            }}
            onClick={toggleCollapsed}
          >
            <ExpandIcon />
          </IconButton>
        )}
      </Stack>
      <Stack
        flexGrow={1}
        paddingY={0.9}
        paddingX={1}
        spacing={0.5}
        height={110}
        boxSizing={"border-box"}
        display={compact && collapsed ? "none" : "flex"}
        bgcolor={theme.customColors.dark2}
      >
        <Row
          left={account.address}
          right={
            <Tooltip title={"Copied"} open={showCopyTooltip}>
              <IconButton onClick={handleCopyAddress}>
                <CopyIcon />
              </IconButton>
            </Tooltip>
          }
          leftProps={{ color: theme.customColors.dark100 }}
        />
        <Row left={`Balance ${symbol}`} right={balanceComponent} />
        <Row
          left={`Protocol`}
          right={labelByProtocolMap[account.asset.protocol]}
        />
      </Stack>
      {!compact && (
        <Stack
          direction={"row"}
          alignItems={"center"}
          width={1}
          height={65}
          borderTop={`1px solid ${theme.customColors.dark15}`}
          paddingX={1}
          paddingTop={1}
          paddingBottom={0.5}
          spacing={1}
          boxSizing={"border-box"}
        >
          <ButtonAction
            label={"Transfer"}
            icon={TransferIcon}
            onClick={onClickTransfer}
          />
          <ButtonAction
            label={"Explore"}
            icon={ExploreIcon}
            onClick={onClickExplorer}
          />
          <ButtonAction
            label={"Private Key"}
            icon={KeyIcon}
            onClick={onClickPrivateKey}
          />
          <ButtonAction
            label={"Reimport"}
            icon={ReimportIcon}
            onClick={onClickReimport}
          />
          <ButtonAction
            label={"Remove"}
            icon={RemoveIcon}
            onClick={onClickRemove}
          />
        </Stack>
      )}
    </Stack>
  );
};

const mapStateToProps = (state: RootState) => ({
  selectedChainByNetwork: state.app.selectedChainByNetwork,
  balanceInfoMap: state.vault.entities.accounts.balances.byId,
});

export default connect(mapStateToProps)(ListAccountItem);
